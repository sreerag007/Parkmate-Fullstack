from rest_framework import viewsets
from rest_framework.viewsets import ViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework import serializers
from rest_framework.views import APIView
from django.contrib.auth import logout, authenticate
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from rest_framework.decorators import action

from .models import (AuthUser, UserProfile, P_Lot, P_Slot, OwnerProfile, Booking,
                     Payment, Tasks, Carwash, Carwash_type, Employee, Review)

from .serializers import (UserRegisterSerializer, OwnerRegisterSerializer,
                          UserProfileSerializer, OwnerProfileSerializer,                          
                          P_LotSerializer,P_SlotSerializer,BookingSerializer,
                          PaymentSerializer,CarwashTypeSerializer,CarwashSerializer,
                          EmployeeSerializer,TasksSerializer,ReviewSerializer,
                          LoginSerializer)


# Custom Permission Classes
class IsAdmin(BasePermission):
    """
    Allow access only to admin users.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        user_role = getattr(user, 'role', '').lower() if getattr(user, 'role', '') else ''
        return user.is_superuser or user_role == 'admin'


class IsAdminOrReadOwn(BasePermission):
    """
    Allow admins to perform any action, regular users can only view/edit their own profile.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        user_role = getattr(user, 'role', '').lower() if getattr(user, 'role', '') else ''
        
        # Admin can do anything
        if user.is_superuser or user_role == 'admin':
            return True
        
        # Regular users can only access their own profile
        if hasattr(obj, 'auth_user'):
            return obj.auth_user == user
        
        return False


class AuthViewSet(ViewSet):
    #user registration
    permission_classes=[AllowAny]
    parser_classes=[MultiPartParser, FormParser,JSONParser]

    def register_user(self, request):
        serializer=UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            auth_user= serializer.save() #AuthUserObject
            token,_=Token.objects.get_or_create(user=auth_user)  
            profile=UserProfile.objects.get(auth_user=auth_user)
            return Response({
                "message":"User Registered Successfully",
                "token":token.key,
                "role":auth_user.role,
                "user_id":profile.id,
                "username":auth_user.username
            },
            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def register_owner(self, request):
        serializer=OwnerRegisterSerializer(data=request.data)
        if serializer.is_valid():
            auth_user=serializer.save()
            token,_=Token.objects.get_or_create(user=auth_user)
            profile=OwnerProfile.objects.get(auth_user=auth_user)
            return Response({
                "message":"Owner Registered Successfully",
                "token":token.key,
                "role":auth_user.role,
                "owner_id":profile.id,
                "username":auth_user.username
            },status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def login(self,request):
        serializer= LoginSerializer(data=request.data)
        if serializer.is_valid():
            auth_user=serializer.validated_data['user']
            token,_=Token.objects.get_or_create(user=auth_user)

            # Check role (case-insensitive) and get profile
            user_role = auth_user.role.lower() if auth_user.role else ''
            
            if user_role == "user":
                profile=UserProfile.objects.get(auth_user=auth_user)
                role_display = "User"
            elif user_role == "owner":
                profile=OwnerProfile.objects.get(auth_user=auth_user)
                role_display = "Owner"
            elif user_role == "admin" or auth_user.is_superuser:
                profile=None
                role_display = "Admin"
            else:
                profile=None
                role_display = auth_user.role if auth_user.role else "User"

            return Response({
                "message":"Login Successful",
                "token":token.key,
                "role":role_display,
                "profile_id":profile.id if profile else None,
                "username":auth_user.username
            },status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def logout(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass

        logout(request)
        return Response({
            "message":"Logged Out Successfully"
        })
    
    def verify(self, request):
        """Verify that the current token is still valid (used for session keep-alive)"""
        # This endpoint requires authentication, so if we get here, token is valid
        auth_user = request.user
        return Response({
            "message": "Token is valid",
            "user": auth_user.username,
            "role": auth_user.role,
            "is_authenticated": auth_user.is_authenticated
        }, status=status.HTTP_200_OK) 
           
class UserProfileViewSet(ModelViewSet):
    queryset=UserProfile.objects.all()
    serializer_class=UserProfileSerializer
    permission_classes=[IsAuthenticated, IsAdminOrReadOwn]

    def get_queryset(self):
        user = self.request.user
        # Admin and Superuser can see all user profiles
        user_role = getattr(user, 'role', '').lower() if getattr(user, 'role', '') else ''
        if user.is_superuser or user_role == 'admin':
            return UserProfile.objects.all()
        # Regular users can only see their own profile
        return UserProfile.objects.filter(auth_user=user)
    
    def update(self, request, *args, **kwargs):
        user_role = getattr(request.user, 'role', '').lower() if getattr(request.user, 'role', '') else ''
        
        # Admin can update any profile
        if request.user.is_superuser or user_role == 'admin':
            profile = UserProfile.objects.get(pk=kwargs.get('pk'))
        else:
            # Regular users can only update their own profile
            profile = UserProfile.objects.get(auth_user=request.user)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a user profile - admin only"""
        user_role = getattr(request.user, 'role', '').lower() if getattr(request.user, 'role', '') else ''
        
        if not (request.user.is_superuser or user_role == 'admin'):
            return Response(
                {'detail': 'Only admins can delete users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile = self.get_object()
        auth_user = profile.auth_user
        
        # Delete the profile first
        profile.delete()
        
        # Then delete the auth user if desired (optional - you might want to keep it for history)
        # Uncomment if you want to delete the auth user too:
        # auth_user.delete()
        
        return Response(
            {'detail': 'User profile deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
    
class OwnerProfileViewSet(ModelViewSet):
    queryset=OwnerProfile.objects.all()
    serializer_class=OwnerProfileSerializer
    permission_classes=[IsAuthenticated, IsAdminOrReadOwn]

    def get_queryset(self):
        user = self.request.user
        # Admin and Superuser can see all owner profiles
        user_role = getattr(user, 'role', '').lower() if getattr(user, 'role', '') else ''
        if user.is_superuser or user_role == 'admin':
            return OwnerProfile.objects.all()
        # Regular owners can only see their own profile
        return OwnerProfile.objects.filter(auth_user=user)

    def update(self, request, *args, **kwargs):
        user_role = getattr(request.user, 'role', '').lower() if getattr(request.user, 'role', '') else ''
        
        # Admin can update any profile
        if request.user.is_superuser or user_role == 'admin':
            profile = OwnerProfile.objects.get(pk=kwargs.get('pk'))
        else:
            # Regular owners can only update their own profile
            profile = OwnerProfile.objects.get(auth_user=request.user)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete an owner profile - admin only"""
        user_role = getattr(request.user, 'role', '').lower() if getattr(request.user, 'role', '') else ''
        
        if not (request.user.is_superuser or user_role == 'admin'):
            return Response(
                {'detail': 'Only admins can delete owners.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile = self.get_object()
        auth_user = profile.auth_user
        
        # Delete the profile first
        profile.delete()
        
        return Response(
            {'detail': 'Owner profile deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def lots(self, request, pk=None):
        """Get all parking lots owned by a specific owner"""
        try:
            owner = self.get_object()
            lots = P_Lot.objects.filter(owner=owner)
            
            print(f"📍 Fetching lots for owner {owner.id} ({owner.firstname} {owner.lastname})")
            print(f"📍 Found {lots.count()} lots")
            
            serializer = P_LotSerializer(lots, many=True)
            return Response({
                'owner_id': owner.id,
                'owner_name': f"{owner.firstname} {owner.lastname}",
                'lots': serializer.data,
                'total_lots': lots.count()
            })
        except OwnerProfile.DoesNotExist:
            return Response(
                {'error': 'Owner not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error fetching lots: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )    


#P_LotViewsets
class P_LotVIewSet(ModelViewSet):
    serializer_class=P_LotSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user

        if user.role =="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return P_Lot.objects.filter(owner=owner)
        return P_Lot.objects.filter(owner__verification_status="APPROVED")
    
    def perform_create(self, serializer):
        owner=OwnerProfile.objects.get(auth_user=self.request.user)
        lot = serializer.save(owner=owner)
        
        # Auto-create parking slots for the new lot
        total_slots = lot.total_slots
        for i in range(total_slots):
            P_Slot.objects.create(
                lot=lot,
                vehicle_type='CAR',  # Default vehicle type
                is_available=True
            )
        print(f"✅ Created {total_slots} parking slots for lot: {lot.lot_name}")

#P_SlotViewsets
class P_SlotViewSet(ModelViewSet):
    serializer_class=P_SlotSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user= self.request.user
        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return P_Slot.objects.filter(lot__owner=owner)
        return P_Slot.objects.filter(lot__owner__verification_status="APPROVED")
    
    def list(self, request, *args, **kwargs):
        """Auto-complete expired bookings and free up slots before returning list"""
        from django.utils import timezone
        
        print(f"\n{'='*60}")
        print(f"📊 SLOTS LIST ENDPOINT - Auto-completing expired bookings")
        print(f"{'='*60}")
        
        # Auto-complete any expired bookings with 'booked' status
        expired_bookings = Booking.objects.filter(
            status='booked',
            end_time__lt=timezone.now()
        )
        
        print(f"🔍 Found {expired_bookings.count()} expired bookings to complete")
        
        for booking in expired_bookings:
            print(f"⏰ Auto-completing expired booking {booking.booking_id}")
            print(f"   Status: {booking.status} → completed")
            print(f"   Slot: {booking.slot.slot_id} → is_available = True")
            
            booking.status = 'completed'
            
            # Auto-clear carwash when booking completes
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s)")
                carwash_services.delete()
            
            booking.save()
            
            # Free up the slot
            booking.slot.is_available = True
            booking.slot.save()
            print(f"✅ Booking {booking.booking_id} completed and slot freed\n")
        
        # Also free up slots for cancelled bookings that still have is_available=False
        cancelled_bookings = Booking.objects.filter(
            status='cancelled',
            slot__is_available=False
        )
        
        print(f"🔍 Found {cancelled_bookings.count()} cancelled bookings with unavailable slots to free")
        
        for booking in cancelled_bookings:
            print(f"🗑️  Freeing slot for cancelled booking {booking.booking_id}")
            print(f"   Slot: {booking.slot.slot_id} → is_available = True")
            
            booking.slot.is_available = True
            booking.slot.save()
            print(f"✅ Slot {booking.slot.slot_id} freed for cancelled booking {booking.booking_id}\n")
        
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        owner=OwnerProfile.objects.get(auth_user=self.request.user)
        lot=serializer.validated_data["lot"]
        if lot.owner !=owner:
            return Response({"error":"You cannot add slots to a lot you dont own."},status=status.HTTP_403_FORBIDDEN)
        serializer.save()

    
class BookingViewSet(ModelViewSet):
    serializer_class=BookingSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user

        if user.role=="User":
            profile=UserProfile.objects.get(auth_user=user)
            return Booking.objects.filter(user=profile)
        
        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            bookings = Booking.objects.filter(lot__owner=owner)
            # Auto-complete expired bookings
            self._auto_complete_expired(bookings)
            return bookings
        
        if user.role=="Admin":
            return Booking.objects.all()
        return Booking.objects.all()
        
    def _auto_complete_expired(self, bookings):
        """Auto-complete bookings that have expired and clear associated carwash services"""
        from django.utils import timezone
        # Auto-complete bookings when their end_time is reached
        expired_bookings = bookings.filter(
            status='booked',
            end_time__lt=timezone.now()
        )
        for booking in expired_bookings:
            print(f"⏰ Auto-completing expired booking {booking.booking_id} (status: {booking.status})")
            booking.status = 'completed'
            booking.slot.is_available = True
            
            # Auto-clear carwash service when booking completes
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
                carwash_services.delete()
            
            booking.slot.save()
            booking.save()

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to auto-complete expired bookings and check payment status"""
        response = super().retrieve(request, *args, **kwargs)
        booking_id = kwargs.get('pk')
        try:
            booking = Booking.objects.get(pk=booking_id)
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now()
            
            # ✅ AUTO-FIX MISSING END_TIME (legacy data)
            if booking.end_time is None and booking.start_time:
                print(f"\n   ⚠️  FIXING: Booking {booking.booking_id} has missing end_time!")
                booking.end_time = booking.start_time + timedelta(hours=1)
                booking.save()
                print(f"   ✅ Set end_time to {booking.end_time}")
            
            print(f"\n📋 RETRIEVE BOOKING {booking.booking_id}")
            print(f"   Status: {booking.status}")
            print(f"   Start time: {booking.start_time}")
            print(f"   End time: {booking.end_time}")
            print(f"   Current time: {now}")
            
            # ✅ CHECK FOR PENDING CASH PAYMENT
            first_payment = booking.payments.order_by('created_at').first()
            if first_payment and first_payment.status == 'PENDING':
                print(f"   ⏳ Payment pending verification (status: PENDING)")
                response.data['payment_status'] = 'PENDING'
                response.data['payment_id'] = first_payment.pay_id
                response.data['timer_active'] = False  # Timer should not start
            elif first_payment:
                print(f"   ✅ Payment verified (status: {first_payment.status})")
                response.data['payment_status'] = first_payment.status
                response.data['payment_id'] = first_payment.pay_id
                response.data['timer_active'] = True  # Timer can start
            
            if booking.end_time:
                time_diff = booking.end_time - now
                print(f"   Time remaining: {time_diff.total_seconds()} seconds")
            
            # Auto-complete if end_time reached and still in 'booked' status
            if booking.status == 'booked' and booking.end_time <= now:
                print(f"   ✅ Auto-completing booking (booked → completed)")
                booking.status = 'completed'
                booking.slot.is_available = True
                
                # Auto-clear carwash service when booking completes
                carwash_services = booking.booking_by_user.all()
                if carwash_services.exists():
                    print(f"   🧼 Auto-clearing {carwash_services.count()} carwash service(s)")
                    carwash_services.delete()
                
                booking.slot.save()
                booking.save()
                response.data['status'] = 'completed'
            else:
                print(f"   ⏳ Booking status unchanged: {booking.status}")
        except Booking.DoesNotExist:
            pass
        return response

    def list(self, request, *args, **kwargs):
        """Override list to handle auto-complete of expired bookings"""
        from django.utils import timezone
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # Auto-complete bookings when their end_time is reached
        booked_bookings = queryset.filter(status='booked', end_time__lte=timezone.now())
        for booking in booked_bookings:
            print(f"✅ Auto-completing booking {booking.booking_id} (booked → completed)")
            booking.status = 'completed'
            
            # Auto-clear carwash service when booking completes
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
                carwash_services.delete()
            
            booking.slot.is_available = True
            booking.slot.save()
            booking.save()
        
        return super().list(request, *args, **kwargs)
        
    def perform_create(self, serializer):
        """Create a new instant booking with proper timing and status"""
        from rest_framework.exceptions import ValidationError
        from django.utils import timezone
        from datetime import timedelta
        
        user = self.request.user
        
        # Get or create user profile
        user_profile = UserProfile.objects.get(auth_user=user)
        
        # Get slot
        slot_id = self.request.data.get('slot')
        try:
            slot = P_Slot.objects.get(pk=slot_id)
        except P_Slot.DoesNotExist:
            raise ValidationError({'slot': 'Slot not found'})
        
        # Check if slot is available
        if not slot.is_available:
            raise ValidationError({'slot': 'This slot is not available'})
        
        # INSTANT BOOKING - Set times to now and now+1hour
        now = timezone.now()
        start_time = now
        end_time = now + timedelta(hours=1)
        
        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            slot=slot,
            start_time__lt=end_time,
            end_time__gt=start_time,
            status='booked'
        ).exists()
        
        if overlapping:
            raise ValidationError({'slot': 'This slot is currently booked'})
        
        # Create the instant booking with payment
        from django.db import transaction
        import time
        
        with transaction.atomic():
            booking = Booking.objects.create(
                user=user_profile,
                slot=slot,
                lot=slot.lot,
                vehicle_number=serializer.validated_data.get('vehicle_number'),
                booking_type=serializer.validated_data.get('booking_type'),
                start_time=start_time,
                end_time=end_time,
                status='booked',
                price=slot.price
            )
            
            # Mark slot as unavailable
            slot.is_available = False
            slot.save()
            
            # Create payment record atomically with booking
            payment_method = self.request.data.get('payment_method', 'UPI')
            amount = self.request.data.get('amount', float(slot.price))
            
            # Determine payment status based on method
            # Cash payments are PENDING, others are SUCCESS
            payment_status = 'PENDING' if payment_method == 'Cash' else 'SUCCESS'
            
            # Generate transaction ID
            transaction_id = f'PM-{booking.booking_id}-{int(time.time())}'
            
            from parking.models import Payment
            payment = Payment.objects.create(
                booking=booking,
                user=user_profile,
                payment_method=payment_method,
                amount=amount,
                status=payment_status,
                transaction_id=transaction_id
            )
            
            print(f"✅ BOOKING created: {booking.booking_id}, status=booked, expires at {end_time}")
            print(f"💳 PAYMENT created: {payment.pay_id}, method={payment_method}, status={payment_status}")
        
        # Set serializer instance for proper response serialization
        serializer.instance = booking

    def perform_update(self, serializer):
        user = self.request.user
        # Allow owners and admin to update booking status
        if user.role not in ["Owner", "Admin"]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only owners and admins can update booking status")
        
        booking = serializer.instance
        new_status = serializer.validated_data.get('status', booking.status)
        
        # If booking is being cancelled, release the slot back to available
        if new_status.lower() == 'cancelled' and booking.status.lower() != 'cancelled':
            print(f"🗑️ Cancelling booking {booking.booking_id}, releasing slot {booking.slot.slot_id}")
            
            # Mark the slot as available
            slot = booking.slot
            slot.is_available = True
            slot.save()
            print(f"✅ Slot {slot.slot_id} is now available")
        
        return serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel a booking (for BOOKED/ACTIVE/SCHEDULED statuses and by owner/admin)"""
        try:
            booking = self.get_object()
            user = request.user
            
            # Check authorization - owner can cancel their own lot's bookings, admin can cancel any
            if user.role == "Owner":
                owner = OwnerProfile.objects.get(auth_user=user)
                if booking.lot.owner != owner:
                    return Response(
                        {'error': 'You can only cancel bookings for your own lots'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.role != "Admin":
                return Response(
                    {'error': 'Only owners and admins can cancel bookings'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if booking can be cancelled - allow cancellation for active/scheduled/booked statuses
            cancellable_statuses = ['booked', 'BOOKED', 'active', 'ACTIVE', 'scheduled', 'SCHEDULED']
            if booking.status not in cancellable_statuses:
                return Response(
                    {'error': f'Cannot cancel booking with status: {booking.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cancel the booking - use uppercase CANCELLED to match new status system
            print(f"🗑️ Cancelling booking {booking.booking_id}, releasing slot {booking.slot.slot_id}")
            booking.status = 'CANCELLED'
            booking.save()
            
            # Release the slot
            slot = booking.slot
            slot.is_available = True
            slot.save()
            print(f"✅ Slot {slot.slot_id} is now available")
            
            serializer = self.get_serializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def renew(self, request, pk=None):
        """Renew a completed/expired booking by creating a new booking with same slot and user"""
        try:
            from django.utils import timezone
            
            booking = self.get_object()
            user = request.user
            now = timezone.now()
            
            print(f"\n{'='*60}")
            print(f"🔄 RENEW ENDPOINT CALLED")
            print(f"{'='*60}")
            print(f"Booking ID: {booking.booking_id} (pk={pk})")
            print(f"Booking Status: '{booking.status}'")
            print(f"Start time: {booking.start_time}")
            print(f"End time: {booking.end_time}")
            print(f"Current time: {now}")
            print(f"Time diff (now - end_time): {now - booking.end_time if booking.end_time else 'N/A'}")
            print(f"Slot Available: {booking.slot.is_available}")
            print(f"Slot ID: {booking.slot.slot_id}")
            print(f"User: {user.username} (role: {user.role})")
            print(f"{'='*60}\n")
            
            # ✅ AUTO-FIX MISSING END_TIME (legacy data)
            if booking.end_time is None and booking.start_time:
                from datetime import timedelta
                print(f"⚠️  FIXING: Booking {booking.booking_id} has missing end_time!")
                booking.end_time = booking.start_time + timedelta(hours=1)
                booking.save()
                print(f"✅ Set end_time to {booking.end_time}\n")
            
            # Check authorization - only the user who made the booking can renew it
            if user.role == "User":
                profile = UserProfile.objects.get(auth_user=user)
                if booking.user != profile:
                    return Response(
                        {'error': 'You can only renew your own bookings'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.role != "Admin":
                return Response(
                    {'error': 'Only users and admins can renew bookings'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # ✅ Check if booking can be renewed (only COMPLETED, CANCELLED, or expired 'booked'/'ACTIVE')
            # Allow renewal only for completed/cancelled bookings or if time has expired
            is_time_expired = (booking.end_time and now > booking.end_time)
            can_renew = booking.status.upper() in ['COMPLETED', 'CANCELLED'] or is_time_expired
            
            if not can_renew:
                error_msg = f'Can only renew completed, cancelled, or expired bookings (current status: {booking.status})'
                print(f"❌ STATUS CHECK FAILED: {error_msg}")
                print(f"   Reason: Status is '{booking.status}' and booking hasn't expired yet (end_time: {booking.end_time}, now: {now})\n")
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Status check PASSED (can renew this booking)")
            
            # Check if the slot is available
            if not booking.slot.is_available:
                error_msg = f'Slot {booking.slot.slot_id} is not available for renewal (is_available={booking.slot.is_available})'
                print(f"❌ SLOT AVAILABILITY CHECK FAILED: {error_msg}\n")
                return Response(
                    {'error': 'Slot is not available for renewal'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Slot availability check PASSED (slot is available)")
            
            # Create new booking with same details
            from datetime import timedelta
            
            print(f"🔄 Renewing booking {booking.booking_id} for user {booking.user.firstname}")
            
            # New instant booking starts now and expires in 1 hour
            new_start_time = timezone.now()
            new_end_time = new_start_time + timedelta(hours=1)
            
            new_booking = Booking.objects.create(
                user=booking.user,
                slot=booking.slot,
                lot=booking.lot,
                vehicle_number=booking.vehicle_number,
                booking_type=booking.booking_type,
                price=booking.price,
                status='booked',  # Renewed booking is always instant and 'booked' (standardized)
                start_time=new_start_time,
                end_time=new_end_time
            )
            
            print(f"   New booking created:")
            print(f"   - Booking ID: {new_booking.booking_id}")
            print(f"   - Start time: {new_booking.start_time}")
            print(f"   - End time: {new_booking.end_time}")
            print(f"   - Current server time: {timezone.now()}")
            print(f"   - Time diff: {new_booking.end_time - timezone.now()}")
            
            # Mark slot as unavailable
            slot = booking.slot
            slot.is_available = False
            slot.save()
            
            # Create Payment for the renewed booking (with payment data from request if provided)
            payment_method = request.data.get('payment_method', 'UPI')
            amount = request.data.get('amount', float(new_booking.price))
            payment_status = 'PENDING' if payment_method == 'Cash' else 'SUCCESS'
            transaction_id = f'PM-{new_booking.booking_id}-{int(__import__("time").time())}'
            
            payment = Payment.objects.create(
                booking=new_booking,
                user=booking.user,
                payment_method=payment_method,
                amount=amount,
                status=payment_status,
                transaction_id=transaction_id
            )
            
            print(f"💳 Payment created for renewed booking:")
            print(f"   - Payment ID: {payment.pay_id}")
            print(f"   - Method: {payment_method}")
            print(f"   - Status: {payment_status}")
            print(f"   - Transaction ID: {transaction_id}")
            
            print(f"✅ New booking {new_booking.booking_id} created with payment, slot {slot.slot_id} marked as unavailable")
            
            serializer = self.get_serializer(new_booking)
            return Response({
                'message': 'Booking renewed successfully',
                'old_booking_id': booking.booking_id,
                'new_booking': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error renewing booking: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentViewSet(ModelViewSet):
    serializer_class=PaymentSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user
        if user.role=="User":
            profile=UserProfile.objects.get(auth_user=user)
            return Payment.objects.filter(user=profile)
        
        if user.role=="Admin":
            return Payment.objects.all()
        return Payment.objects.none()
    
    def perform_create(self, serializer):
        user_profile=UserProfile.objects.get(auth_user=self.request.user)
        serializer.save(user=user_profile)
        

class CarwashViewSet(ModelViewSet):
    serializer_class=CarwashSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user

        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return Carwash.objects.filter(booking__lot__owner=owner)
        
        if user.role=="User":
            profile=UserProfile.objects.get(auth_user=user)
            return Carwash.objects.filter(booking__user=profile)
        return Carwash.objects.all()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def owner_services(self, request):
        """Get all carwash services for owner's lots with full booking details"""
        try:
            user = request.user
            
            print(f"\n{'='*60}")
            print(f"📋 OWNER SERVICES ENDPOINT")
            print(f"{'='*60}")
            print(f"User: {user.username}")
            print(f"User role (direct): {getattr(user, 'role', 'NOT_SET')}")
            print(f"User is_superuser: {user.is_superuser}")
            print(f"{'='*60}\n")
            
            # Verify user is owner - use getattr as fallback
            user_role = getattr(user, 'role', None)
            if user_role != "Owner":
                print(f"❌ Access denied - user role is '{user_role}', not 'Owner'")
                return Response(
                    {'error': f'Only owners can access this endpoint. Your role: {user_role}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                owner = OwnerProfile.objects.get(auth_user=user)
            except OwnerProfile.DoesNotExist:
                print(f"❌ OwnerProfile not found for user {user.username}")
                return Response(
                    {'error': 'Owner profile not found. Please complete owner registration.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"✅ Fetching carwash services for owner {owner.id} ({owner.firstname} {owner.lastname})")
            
            # Get all carwashes for owner's lots
            carwashes = Carwash.objects.filter(
                booking__lot__owner=owner
            ).select_related(
                'booking__user',
                'booking__lot',
                'booking__slot',
                'carwash_type',
                'employee'
            ).order_by('-booking__booking_time')
            
            # Auto-complete carwashes with expired bookings
            from django.utils import timezone
            expired_carwashes = carwashes.filter(
                booking__status='booked',
                booking__end_time__lt=timezone.now()
            )
            for carwash in expired_carwashes:
                print(f"⏰ Auto-completing carwash {carwash.carwash_id} with expired booking {carwash.booking.booking_id}")
                carwash.booking.status = 'completed'
                carwash.booking.save()
            
            print(f"✅ Found {carwashes.count()} carwash services")
            
            serializer = CarwashSerializer(carwashes, many=True)
            return Response({
                'owner_id': owner.id,
                'owner_name': f"{owner.firstname} {owner.lastname}",
                'carwashes': serializer.data,
                'total_services': carwashes.count()
            })
        except OwnerProfile.DoesNotExist:
            return Response(
                {'error': 'Owner profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error fetching owner services: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def pay_for_service(self, request):
        """Create payment and car wash booking for a service"""
        try:
            user = request.user
            
            # Get user profile
            try:
                user_profile = UserProfile.objects.get(auth_user=user)
            except UserProfile.DoesNotExist:
                return Response(
                    {'error': 'User profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get booking ID from request
            booking_id = request.data.get('booking_id')
            if not booking_id:
                return Response(
                    {'error': 'booking_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the booking
            try:
                booking = Booking.objects.get(booking_id=booking_id, user=user_profile)
            except Booking.DoesNotExist:
                return Response(
                    {'error': 'Booking not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if a car wash service is already booked for this booking
            existing_carwash = Carwash.objects.filter(booking=booking).first()
            if existing_carwash:
                return Response(
                    {'error': 'A car wash service is already active for this booking. Complete or cancel the existing service first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get payment data from request
            payment_method = request.data.get('payment_method', 'UPI')
            amount = request.data.get('amount', 0.00)
            carwash_type_id = request.data.get('carwash_type_id')
            
            # Validate payment method
            valid_methods = ['CC', 'UPI', 'Cash']
            if payment_method not in valid_methods:
                return Response(
                    {'error': f'Invalid payment method. Must be one of: {valid_methods}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate amount
            try:
                amount = float(amount)
                if amount <= 0:
                    return Response(
                        {'error': 'Amount must be greater than 0'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid amount format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Note: We allow multiple payments for one booking (slot payment + car wash payment)
            # The duplicate check below only prevents multiple car wash services
            
            # Determine payment status based on method
            payment_status = 'PENDING' if payment_method == 'Cash' else 'SUCCESS'
            
            # Generate transaction ID
            import time
            transaction_id = f'CW-{booking.booking_id}-{int(time.time())}'
            
            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                user=user_profile,
                payment_method=payment_method,
                amount=amount,
                status=payment_status,
                transaction_id=transaction_id
            )
            
            print(f"✅ Car Wash Payment created: {payment.pay_id}")
            print(f"   - Transaction ID: {transaction_id}")
            print(f"   - Method: {payment_method}")
            print(f"   - Amount: ₹{amount}")
            print(f"   - Status: {payment_status}")
            
            # If carwash_type_id provided, create car wash booking
            carwash = None
            if carwash_type_id:
                try:
                    carwash_type = Carwash_type.objects.get(carwash_type_id=carwash_type_id)
                    print(f"🔍 Carwash type found: {carwash_type.name}")
                    
                    # For now, assign to the first available employee
                    # In production, this would be based on availability
                    print(f"🔍 Looking for employee with owner: {booking.lot.owner}")
                    employee = Employee.objects.filter(owner=booking.lot.owner).first()
                    print(f"🔍 Employee found: {employee}")
                    
                    if employee:
                        # Set carwash status based on payment status
                        carwash_status = 'pending' if payment_status == 'PENDING' else 'active'
                        
                        carwash = Carwash.objects.create(
                            booking=booking,
                            carwash_type=carwash_type,
                            employee=employee,
                            price=amount,
                            status=carwash_status
                        )
                        print(f"✅ Car Wash booking created: {carwash.carwash_id}")
                        print(f"   - Service: {carwash_type.name}")
                        print(f"   - Employee: {employee.name}")
                    else:
                        print(f"⚠️ No employee found for owner {booking.lot.owner}")
                except Carwash_type.DoesNotExist:
                    print(f"⚠️ Carwash type {carwash_type_id} not found, payment created without service booking")
                except Exception as e:
                    print(f"⚠️ Error creating car wash booking: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            # Return success response
            return Response({
                'message': 'Car Wash Service booked successfully ✅',
                'payment_id': payment.pay_id,
                'transaction_id': transaction_id,
                'payment_method': payment_method,
                'amount': amount,
                'payment_status': payment_status,
                'carwash_id': carwash.carwash_id if carwash else None,
                'booking_id': booking_id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error processing car wash payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CarwashTypeViewSet(ModelViewSet):
    serializer_class=CarwashTypeSerializer
    queryset=Carwash_type.objects.all()
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        # All authenticated users can view carwash types
        return Carwash_type.objects.all()
    
    def perform_update(self, serializer):
        user = self.request.user
        # Only admin can update carwash types
        if not (user.is_superuser or getattr(user, 'role', '') == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can update carwash service details")
        serializer.save()
    
    def perform_create(self, serializer):
        user = self.request.user
        # Only admin can create carwash types
        if not (user.is_superuser or getattr(user, 'role', '') == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can create carwash types")
        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        # Admin cannot delete carwash types in this version
        if not (user.is_superuser or getattr(user, 'role', '') == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can delete carwash types")
        # Prevent deletion regardless
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Carwash types cannot be deleted in this version")


class EmployeeViewSet(ModelViewSet):
    serializer_class=EmployeeSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user
        if user.is_superuser or getattr(user,'role','')=='Admin':
            return Employee.objects.all()
        
        if getattr(user, 'role','')=='Owner':
            try:
                owner=OwnerProfile.objects.get(auth_user=user)
                return Employee.objects.filter(owner=owner)
            except OwnerProfile.DoesNotExist:
                return Employee.objects.none()
        
        # Regular users can see all employees (for car wash booking)
        return Employee.objects.all()
    
    def perform_update(self, serializer):
        user = self.request.user
        # Only admin can assign employees to owners
        if not (user.is_superuser or getattr(user, 'role', '') == 'Admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can assign employees to owners")
        serializer.save()
    
    def perform_create(self, serializer):
        user=self.request.user
        if user.is_superuser or getattr(user,'role','')=='Admin':
            owner_id=self.request.data.get('owner_id')

            if not owner_id:
                raise serializers.ValidationError({"owner_id": "As Admin, you must provide an owner_id field."})
            
            try:
                target_owner=OwnerProfile.objects.get(id=owner_id)
                serializer.save(owner=target_owner)

            except OwnerProfile.DoesNotExist:
                raise serializers.ValidationError({"owner_id": "Owner ID not found."})

        else:
            owner=OwnerProfile.objects.get(auth_user=user)
            serializer.save(owner=owner)    
                


class TasksViewSet(viewsets.ModelViewSet):
    serializer_class=TasksSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user

        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return Tasks.objects.filter(booking__lot__owner=owner)
        
        if user.role=="Employee":
            employee=Employee.objects.get(auth_user=user)
            return Tasks.objects.filter(employee=employee)
        return Tasks.objects.none()

    
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class=ReviewSerializer
    permission_classes=[IsAuthenticated]       

    def get_queryset(self):
        lot_id=self.request.query_params.get("lot")
        if lot_id:
            return Review.objects.filter(lot_id=lot_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        user_profile=UserProfile.objects.get(auth_user=self.request.user)
        serializer.save(user=user_profile)                             


class VerifyCashPaymentView(APIView):
    """
    Endpoint to verify cash payment and activate booking/carwash service.
    Only parking lot owners can verify payments for their lots.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):
        """
        Verify a cash payment and activate associated booking/carwash service.
        
        Payload:
        {
            "verified": true
        }
        
        Returns:
        {
            "message": "Payment verified successfully",
            "payment_id": "...",
            "booking_id": "...",
            "carwash_id": "..." (if applicable)
        }
        """
        try:
            user = request.user
            
            print(f"🔍 Verification request from user: {user.username} (id={user.id})")
            print(f"   Role: {getattr(user, 'role', 'unknown')}")
            
            # Get the payment
            try:
                payment = Payment.objects.get(pay_id=payment_id)
            except Payment.DoesNotExist:
                return Response(
                    {'error': 'Payment not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"📋 Payment found: {payment.pay_id}")
            
            # Check if payment is already verified
            if payment.status == 'SUCCESS':
                return Response(
                    {'message': 'Payment is already verified ✓', 'payment_id': payment.pay_id},
                    status=status.HTTP_200_OK
                )
            
            # Check if payment is cash and pending
            if payment.payment_method != 'Cash' or payment.status != 'PENDING':
                return Response(
                    {'error': 'Only pending cash payments can be verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check permission: user must be owner of the parking lot
            booking = payment.booking
            lot_owner = booking.lot.owner
            
            print(f"🔐 Lot owner: {lot_owner} (id={lot_owner.id})")
            
            try:
                current_owner = OwnerProfile.objects.get(auth_user=user)
                print(f"✓ Found owner profile for user: {current_owner}")
            except OwnerProfile.DoesNotExist:
                print(f"❌ User {user.username} is not an owner")
                return Response(
                    {'error': 'Only parking lot owners can verify payments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if current_owner != lot_owner:
                print(f"❌ Owner mismatch: {current_owner.id} != {lot_owner.id}")
                return Response(
                    {'error': 'You do not have permission to verify this payment'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            print(f"✅ Verifying cash payment: {payment.pay_id}")
            print(f"   - Booking: {booking.booking_id}")
            print(f"   - Amount: ₹{payment.amount}")
            
            # Update payment status to SUCCESS
            payment.status = 'SUCCESS'
            payment.verified_by = user
            payment.verified_at = timezone.now()
            payment.save()
            
            print(f"✅ Payment status updated to SUCCESS")
            
            # If this is a slot payment (first payment), update booking status
            payment_order = Payment.objects.filter(
                booking=booking,
                created_at__lte=payment.created_at
            ).count()
            
            if payment_order == 1:  # First payment = slot payment
                booking.status = 'booked'
                booking.save()
                print(f"✅ Booking status updated to 'booked'")
            
            # Find and activate any pending carwash service associated with this booking
            carwash_id = None
            carwash_payments = Payment.objects.filter(
                booking=booking,
                status='SUCCESS'
            ).exclude(pay_id=payment.pay_id)
            
            if carwash_payments.exists():
                # There are other successful payments, likely carwash
                carwash = Carwash.objects.filter(booking=booking).first()
                if carwash:
                    carwash.status = 'active'
                    carwash.save()
                    carwash_id = carwash.carwash_id
                    print(f"✅ Carwash service activated: {carwash_id}")
            
            return Response({
                'message': '✓ Payment verified successfully. Booking activated!',
                'payment_id': payment.pay_id,
                'booking_id': booking.booking_id,
                'carwash_id': carwash_id,
                'verified_at': payment.verified_at
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error verifying cash payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


