from rest_framework import viewsets
from rest_framework.viewsets import ViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework import permissions
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework import serializers
from rest_framework.views import APIView
from django.contrib.auth import logout, authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from rest_framework.decorators import action

from .models import (AuthUser, UserProfile, P_Lot, P_Slot, OwnerProfile, Booking,
                     Payment, Tasks, Carwash, Carwash_type, Employee, Review,
                     CarWashBooking, CarWashService)

from .serializers import (UserRegisterSerializer, OwnerRegisterSerializer,
                          UserProfileSerializer, OwnerProfileSerializer,                          
                          P_LotSerializer,P_SlotSerializer,BookingSerializer,
                          PaymentSerializer,CarwashTypeSerializer,CarwashSerializer,
                          EmployeeSerializer,TasksSerializer,ReviewSerializer,
                          LoginSerializer, CarWashServiceSerializer,
                          CarWashBookingSerializer, CarWashPaymentSerializer)

from .notification_utils import send_ws_notification


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
            queryset = P_Lot.objects.filter(owner=owner)
        else:
            queryset = P_Lot.objects.filter(owner__verification_status="APPROVED")
        
        # Add search functionality
        search_query = self.request.query_params.get('q', '').strip()
        if search_query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(lot_name__icontains=search_query) |
                Q(street_name__icontains=search_query) |
                Q(locality__icontains=search_query) |
                Q(city__icontains=search_query)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to add debugging for image upload"""
        print(f"\n{'='*60}")
        print(f"📋 Creating lot - Content-Type: {request.content_type}")
        print(f"📋 Request DATA keys: {list(request.data.keys())}")
        print(f"📋 Request FILES keys: {list(request.FILES.keys())}")
        print(f"📋 Has lot_image in DATA: {'lot_image' in request.data}")
        print(f"📋 Has lot_image in FILES: {'lot_image' in request.FILES}")
        
        if 'lot_image' in request.FILES:
            image = request.FILES['lot_image']
            print(f"📸 Image in FILES - Name: {image.name}, Size: {image.size} bytes, Content-Type: {image.content_type}")
        elif 'lot_image' in request.data:
            print(f"📸 Image in DATA - Value: {request.data.get('lot_image')}")
            
        print(f"{'='*60}\n")
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        owner=OwnerProfile.objects.get(auth_user=self.request.user)
        print(f"💾 Saving lot with validated_data keys: {list(serializer.validated_data.keys())}")
        print(f"💾 lot_image in validated_data: {'lot_image' in serializer.validated_data}")
        if 'lot_image' in serializer.validated_data:
            print(f"💾 lot_image value: {serializer.validated_data['lot_image']}")
            
        lot = serializer.save(owner=owner)
        print(f"✅ Lot saved: ID={lot.lot_id}, Name={lot.lot_name}, lot_image={lot.lot_image}")
        
        # Auto-create parking slots for the new lot
        total_slots = lot.total_slots
        for i in range(total_slots):
            P_Slot.objects.create(
                lot=lot,
                vehicle_type='Sedan',  # Default vehicle type (valid choice)
                is_available=True
            )
        print(f"✅ Created {total_slots} parking slots for lot: {lot.lot_name}")


#P_SlotViewsets
class P_SlotViewSet(ModelViewSet):
    serializer_class=P_SlotSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user= self.request.user
        
        # Get base queryset based on user role
        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            queryset = P_Slot.objects.filter(lot__owner=owner)
        else:
            queryset = P_Slot.objects.filter(lot__owner__verification_status="APPROVED")
        
        # Apply optional filters from query parameters
        vehicle_type = self.request.GET.get('vehicle_type')
        lot_id = self.request.GET.get('lot_id')
        
        print(f"\n🔍 SLOT QUERY PARAMS:")
        print(f"   vehicle_type: {vehicle_type}")
        print(f"   lot_id: {lot_id}")
        print(f"   Initial queryset count: {queryset.count()}")
        
        if vehicle_type and vehicle_type.lower() != 'all':
            print(f"   ✅ Applying vehicle_type filter: {vehicle_type}")
            queryset = queryset.filter(vehicle_type__iexact=vehicle_type)
            print(f"   After vehicle_type filter: {queryset.count()} slots")
        
        if lot_id:
            print(f"   ✅ Applying lot_id filter: {lot_id}")
            queryset = queryset.filter(lot__lot_id=lot_id)
            print(f"   After lot_id filter: {queryset.count()} slots")
        
        print(f"   Final queryset count: {queryset.count()}\n")
        return queryset
    
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
            
            # Auto-clear carwash when booking completes and release employees
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} add-on carwash service(s)")
                for carwash in carwash_services:
                    # Release employee assigned to this add-on carwash
                    if carwash.employee:
                        employee = carwash.employee
                        print(f"   🔄 Releasing employee: {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
                        old_assignments = employee.current_assignments
                        employee.current_assignments = max(0, employee.current_assignments - 1)
                        if employee.current_assignments < 3:
                            employee.availability_status = 'available'
                        employee.save()
                        print(f"   ✅ Employee released: {old_assignments} → {employee.current_assignments}, Status: {employee.availability_status}")
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
            
            # Auto-clear add-on carwash service when booking completes and release employees
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} add-on carwash service(s) for booking {booking.booking_id}")
                for carwash in carwash_services:
                    # Release employee assigned to this add-on carwash
                    if carwash.employee:
                        employee = carwash.employee
                        print(f"   🔄 Releasing employee: {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
                        old_assignments = employee.current_assignments
                        employee.current_assignments = max(0, employee.current_assignments - 1)
                        if employee.current_assignments < 3:
                            employee.availability_status = 'available'
                        employee.save()
                        print(f"   ✅ Employee released: {old_assignments} → {employee.current_assignments}, Status: {employee.availability_status}")
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
                booking.end_time = booking.start_time + timedelta(minutes=10)
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
        
        # INSTANT BOOKING - Set times to now and now+10minutes
        now = timezone.now()
        start_time = now
        end_time = now + timedelta(minutes=10)
        
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
                vehicle_type=slot.vehicle_type,  # Use the slot's vehicle type, not user's
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
                booking.end_time = booking.start_time + timedelta(minutes=10)
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
            
            # New instant booking starts now and expires in 10 minutes
            new_start_time = timezone.now()
            new_end_time = new_start_time + timedelta(minutes=10)
            
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
            
            # Event 3: Send "Renew Success" notification to user
            send_ws_notification(
                booking.user.auth_user.id,
                "success",
                f"Booking renewed successfully! Your new booking ID is {new_booking.booking_id}."
            )
            
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
            
            # Event 4: Send "Renew Failure" notification to user
            try:
                send_ws_notification(
                    user.userprofile.id if hasattr(user, 'userprofile') else user.id,
                    "error",
                    f"Renewal failed: {str(e)}. Please try again."
                )
            except:
                pass
            
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
        
        if user.role.lower()=="admin" or user.is_superuser:
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
    
    def perform_update(self, serializer):
        """Override update to handle employee availability when car wash is completed"""
        carwash = self.get_object()
        old_status = carwash.status
        
        # Save the updated carwash
        updated_carwash = serializer.save()
        new_status = updated_carwash.status
        
        # If car wash is completed or cancelled, free up the employee
        if old_status != new_status and new_status in ['completed', 'cancelled']:
            employee = updated_carwash.employee
            if employee:
                print(f"\n{'='*60}")
                print(f"🔄 RELEASING EMPLOYEE (Add-on Car Wash)")
                print(f"{'='*60}")
                print(f"   Car Wash ID: {updated_carwash.carwash_id}")
                print(f"   Booking ID: {updated_carwash.booking.booking_id}")
                print(f"   Status: {old_status} → {new_status}")
                print(f"   Employee: {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
                
                # Decrease employee's workload
                old_assignments = employee.current_assignments
                employee.current_assignments = max(0, employee.current_assignments - 1)
                
                # Mark employee as available if they have capacity
                old_availability = employee.availability_status
                if employee.current_assignments < 3:
                    employee.availability_status = 'available'
                
                employee.save()
                
                print(f"✅ Employee released:")
                print(f"   Assignments: {old_assignments} → {employee.current_assignments}")
                print(f"   Availability: {old_availability} → {employee.availability_status}")
                print(f"{'='*60}\n")
    
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
            
            # Auto-complete carwashes with expired bookings and release employees
            from django.utils import timezone
            expired_carwashes = carwashes.filter(
                booking__status='booked',
                booking__end_time__lt=timezone.now()
            )
            for carwash in expired_carwashes:
                print(f"⏰ Auto-completing add-on carwash {carwash.carwash_id} with expired booking {carwash.booking.booking_id}")
                
                # Release employee if assigned
                if carwash.employee:
                    employee = carwash.employee
                    print(f"   🔄 Releasing employee: {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
                    old_assignments = employee.current_assignments
                    employee.current_assignments = max(0, employee.current_assignments - 1)
                    if employee.current_assignments < 3:
                        employee.availability_status = 'available'
                    employee.save()
                    print(f"   ✅ Employee released: {old_assignments} → {employee.current_assignments}, Status: {employee.availability_status}")
                
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
        from django.db import transaction
        
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
            
            # Use atomic transaction to prevent race conditions
            with transaction.atomic():
                # Get the booking with SELECT FOR UPDATE to lock the row
                try:
                    booking = Booking.objects.select_for_update().get(booking_id=booking_id, user=user_profile)
                except Booking.DoesNotExist:
                    return Response(
                        {'error': 'Booking not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Check if a car wash service is already booked for this booking
                # Only prevent booking if there's an ACTIVE or PENDING carwash (not completed/cancelled)
                existing_carwash = Carwash.objects.filter(
                    booking=booking,
                    status__in=['active', 'pending']
                ).first()
                if existing_carwash:
                    return Response(
                        {'error': f'A car wash service ({existing_carwash.carwash_type.name}) is already active for this booking. Complete or cancel the existing service first.'},
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
                # The duplicate check above only prevents multiple car wash services
                
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
                        
                        print(f"\n{'='*60}")
                        print(f"🔍 ADD-ON CAR WASH EMPLOYEE ASSIGNMENT")
                        print(f"{'='*60}")
                        print(f"   Booking ID: {booking.booking_id}")
                        print(f"   Lot: {booking.lot.lot_name}")
                        print(f"   Owner: {booking.lot.owner.firstname} {booking.lot.owner.lastname} ({booking.lot.owner.id})")
                        print(f"   Service Type: {carwash_type.name}")
                        
                        # Smart employee assignment: Find available employee with least workload
                        available_employees = Employee.objects.filter(
                            owner=booking.lot.owner,
                            availability_status='available'
                        ).order_by('current_assignments')
                        
                        print(f"   Available employees: {available_employees.count()}")
                        
                        employee = available_employees.first()
                        
                        # Set carwash status based on payment status
                        # If no employee available, set to 'pending' so owner can assign later
                        if employee:
                            carwash_status = 'pending' if payment_status == 'PENDING' else 'active'
                        else:
                            carwash_status = 'pending'  # Pending until owner assigns employee
                            print(f"⚠️ No employees available - creating carwash as 'pending' for later assignment")
                        
                        # Final check: Query with lock to ensure no concurrent creation
                        # Using select_for_update() locks matching rows, preventing race conditions
                        locked_existing = Carwash.objects.select_for_update().filter(
                            booking=booking,
                            status__in=['active', 'pending']
                        )
                        
                        if locked_existing.count() > 0:
                            print(f"❌ Race condition detected: Another carwash was created concurrently")
                            return Response(
                                {'error': 'A car wash service is already being processed for this booking.'},
                                status=status.HTTP_409_CONFLICT
                            )
                        
                        # Use serializer for validation and creation (instead of direct create)
                        from parking.serializers import CarwashSerializer
                        carwash_data = {
                            'booking': booking.booking_id,
                            'carwash_type': carwash_type.carwash_type_id,
                            'employee': employee.employee_id if employee else None,
                            'status': carwash_status
                        }
                        
                        print(f"🔍 Creating carwash via serializer with data: {carwash_data}")
                        carwash_serializer = CarwashSerializer(data=carwash_data)
                        
                        if not carwash_serializer.is_valid():
                            print(f"❌ Carwash serializer validation failed: {carwash_serializer.errors}")
                            error_msg = carwash_serializer.errors.get('booking', ['Validation error'])[0]
                            return Response(
                                {'error': str(error_msg)},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        try:
                            carwash = carwash_serializer.save()
                        except Exception as db_error:
                            # Catch database constraint violation (unique constraint on active/pending carwash per booking)
                            if 'unique_active_carwash_per_booking' in str(db_error):
                                print(f"❌ Database constraint violation: Duplicate carwash prevented by DB")
                                return Response(
                                    {'error': 'A car wash service is already active for this booking.'},
                                    status=status.HTTP_409_CONFLICT
                                )
                            else:
                                # Re-raise if it's a different error
                                raise
                        
                        # Update employee workload if employee was assigned
                        if employee:
                            employee.current_assignments += 1
                            if employee.current_assignments >= 3:  # Max 3 concurrent assignments
                                employee.availability_status = 'busy'
                            employee.save()
                            
                            print(f"✅ Employee assigned: {employee.firstname} {employee.lastname}")
                            print(f"   Employee ID: {employee.employee_id}")
                            print(f"   Current assignments: {employee.current_assignments}")
                            print(f"   Status: {employee.availability_status}")
                        else:
                            print(f"⚠️ No employee assigned - owner needs to assign manually")
                        
                        print(f"✅ Add-on Car Wash created: ID={carwash.carwash_id}, Status={carwash_status}")
                        print(f"{'='*60}\n")
                    except Carwash_type.DoesNotExist:
                        print(f"⚠️ Carwash type {carwash_type_id} not found")
                        # Rollback payment if carwash type doesn't exist
                        print(f"   Rolling back payment...")
                        payment.delete()
                        return Response(
                            {'error': 'Invalid car wash service type.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    except Exception as e:
                        print(f"⚠️ Error creating car wash booking: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        # Rollback payment if unexpected error occurs
                        print(f"   Rolling back payment...")
                        payment.delete()
                        return Response(
                            {'error': f'Failed to create car wash service: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                
                # Return success - carwash created (with or without employee)
                success_message = 'Car Wash Service booked successfully ✅'
                if carwash and not carwash.employee:
                    success_message += ' (Employee will be assigned by owner)'
                
                return Response({
                    'message': success_message,
                    'payment_id': payment.pay_id,
                    'transaction_id': transaction_id,
                    'payment_method': payment_method,
                    'amount': amount,
                    'payment_status': payment_status,
                    'carwash_id': carwash.carwash_id if carwash else None,
                    'carwash_status': carwash.status if carwash else None,
                    'employee_assigned': carwash.employee is not None if carwash else False,
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
    
    def get_permissions(self):
        """
        Allow unauthenticated POST (for employee registration)
        Require authentication for all other operations
        """
        if self.action == 'create':
            return []  # No authentication required for employee registration
        return [IsAuthenticated()]

    def get_queryset(self):
        user=self.request.user
        if user.is_superuser or getattr(user,'role','')=='Admin':
            return Employee.objects.all()
        
        if getattr(user, 'role','')=='Owner':
            try:
                owner=OwnerProfile.objects.get(auth_user=user)
                # Return both employees assigned to this owner AND unassigned employees
                from django.db.models import Q
                return Employee.objects.filter(Q(owner=owner) | Q(owner__isnull=True))
            except OwnerProfile.DoesNotExist:
                return Employee.objects.none()
        
        # Regular users can see all employees (for car wash booking)
        return Employee.objects.all()
    
    def perform_update(self, serializer):
        user = self.request.user
        employee_id = self.kwargs.get('pk')
        
        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Employee not found")
        
        # Admin can update any employee
        if user.is_superuser or getattr(user, 'role', '') == 'Admin':
            serializer.save()
            return
        
        # Owner can update employees assigned to them or assign unassigned employees
        if getattr(user, 'role', '') == 'Owner':
            owner = OwnerProfile.objects.get(auth_user=user)
            new_owner_id = self.request.data.get('owner')
            
            # If assigning to themselves from unassigned
            if new_owner_id == owner.id and employee.owner is None:
                serializer.save()
                return
            
            # If unassigning their own employee (setting owner to null)
            if new_owner_id is None and employee.owner == owner:
                serializer.save()
                return
            
            # If updating their own employee's other details
            if employee.owner == owner:
                serializer.save()
                return
        
        # Otherwise, permission denied
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You don't have permission to modify this employee")
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # If user is not authenticated, create employee without owner (public registration)
        if not user or not user.is_authenticated:
            serializer.save(owner=None)  # Employee registered but not assigned to any owner
            return
        
        # Admin can create and assign employee to an owner
        if user.is_superuser or getattr(user, 'role', '') == 'Admin':
            owner_id = self.request.data.get('owner_id')

            if not owner_id:
                # Admin can create unassigned employee
                serializer.save(owner=None)
                return
            
            try:
                target_owner = OwnerProfile.objects.get(id=owner_id)
                serializer.save(owner=target_owner)
            except OwnerProfile.DoesNotExist:
                raise serializers.ValidationError({"owner_id": "Owner ID not found."})
        
        # Owner can create employee for themselves
        elif getattr(user, 'role', '') == 'Owner':
            owner = OwnerProfile.objects.get(auth_user=user)
            serializer.save(owner=owner)
        
        # Default: create unassigned employee
        else:
            serializer.save(owner=None)    
                


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
    
    def get_permissions(self):
        """
        Allow any user to read reviews (list, retrieve).
        Require authentication for create, update, delete.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]       

    def get_queryset(self):
        try:
            # Check if user is authenticated
            if not self.request.user or not self.request.user.is_authenticated:
                # Unauthenticated users can see all reviews
                return Review.objects.all().order_by('-created_at')
            
            user_role = self.request.user.role
            lot_id = self.request.query_params.get("lot_id")  # Changed from "lot" to "lot_id"
            user_id = self.request.query_params.get("user_id")  # Also changed to "user_id" for consistency
            review_type = self.request.query_params.get("type")  # NEW: Filter by review type (SLOT or CARWASH)
            
            # Convert to integer if provided
            if lot_id:
                try:
                    lot_id = int(lot_id)
                except (ValueError, TypeError):
                    lot_id = None
            
            if user_id:
                try:
                    user_id = int(user_id)
                except (ValueError, TypeError):
                    user_id = None
            
            print(f"DEBUG: get_queryset called for user: {self.request.user.username}, role: {user_role}")
            print(f"DEBUG: Query params - lot_id: {lot_id} (type: {type(lot_id).__name__}), user_id: {user_id} (type: {type(user_id).__name__}), review_type: {review_type}")
            print(f"DEBUG: Total reviews in DB: {Review.objects.count()}")
            
            # For users - show all reviews, they can only edit/delete their own
            # For owners - show only reviews for their lots
            # For admins - show all reviews
            
            if user_role == 'Owner':
                # User is an owner - filter by their lots
                try:
                    owner_profile = OwnerProfile.objects.get(auth_user=self.request.user)
                    print(f"DEBUG: Found owner profile ID: {owner_profile.id}, name: {owner_profile.firstname} {owner_profile.lastname}")
                    
                    # Filter lots where owner field equals this owner_profile
                    owned_lots = P_Lot.objects.filter(owner=owner_profile)
                    owned_lots_list = list(owned_lots.values_list('lot_id', 'lot_name'))
                    print(f"DEBUG: Owner's lots: {owned_lots_list}")
                    
                    # Get all reviews for these lots
                    queryset = Review.objects.filter(lot__in=owned_lots)
                    print(f"DEBUG: Reviews found for owner's lots: {queryset.count()}")
                    
                    # Debug: Show all reviews with their lot_id
                    all_reviews = Review.objects.all().values_list('rev_id', 'lot_id', 'rating', 'review_desc')
                    print(f"DEBUG: All reviews in DB: {list(all_reviews)}")
                    
                except OwnerProfile.DoesNotExist:
                    print(f"DEBUG: OwnerProfile not found for auth_user {self.request.user.id}")
                    queryset = Review.objects.none()
            elif user_role == 'Admin':
                # User is an admin - show all reviews
                queryset = Review.objects.all()
                print(f"DEBUG: Admin user - showing all {queryset.count()} reviews")
            else:
                # Regular user - show all reviews (for reading), they can only edit their own
                queryset = Review.objects.all()
                print(f"DEBUG: Regular user - showing all {queryset.count()} reviews")
            
            # Apply filters
            if lot_id:
                queryset = queryset.filter(lot_id=lot_id)
                print(f"DEBUG: Filtered by lot_id={lot_id}, results: {queryset.count()}")
            if user_id:
                queryset = queryset.filter(user_id=user_id)
                print(f"DEBUG: Filtered by user_id={user_id}, results: {queryset.count()}")
            
            # NEW: Filter by review type
            if review_type and review_type.upper() in ['SLOT', 'CARWASH']:
                queryset = queryset.filter(review_type=review_type.upper())
                print(f"DEBUG: Filtered by review_type={review_type.upper()}, results: {queryset.count()}")
                
            return queryset.order_by('-created_at')
        except Exception as e:
            print(f"DEBUG: Exception in get_queryset: {str(e)}")
            return Review.objects.none()

    def perform_create(self, serializer):
        try:
            user_profile = UserProfile.objects.get(auth_user=self.request.user)
            serializer.save(user=user_profile)
        except UserProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User profile not found")

    def perform_update(self, serializer):
        # Only allow users to update their own reviews
        from rest_framework.exceptions import PermissionDenied
        try:
            user_profile = UserProfile.objects.get(auth_user=self.request.user)
            if serializer.instance.user != user_profile:
                raise PermissionDenied("You can only edit your own reviews")
            serializer.save()
        except UserProfile.DoesNotExist:
            raise PermissionDenied("User profile not found")

    def perform_destroy(self, instance):
        # Only allow users to delete their own reviews
        from rest_framework.exceptions import PermissionDenied
        try:
            user_profile = UserProfile.objects.get(auth_user=self.request.user)
            if instance.user != user_profile:
                raise PermissionDenied("You can only delete your own reviews")
            instance.delete()
        except UserProfile.DoesNotExist:
            raise PermissionDenied("User profile not found")                             


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
            print(f"   Lot: {booking.lot.lot_name}")
            
            try:
                current_owner = OwnerProfile.objects.get(auth_user=user)
                print(f"✓ Found owner profile for user: {current_owner} (id={current_owner.id})")
            except OwnerProfile.DoesNotExist:
                print(f"❌ User {user.username} is not an owner")
                return Response(
                    {'error': 'Only parking lot owners can verify payments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            print(f"🔐 Comparing: current_owner.id ({current_owner.id}) vs lot_owner.id ({lot_owner.id})")
            
            if current_owner.id != lot_owner.id:
                print(f"❌ Owner mismatch: {current_owner.id} != {lot_owner.id}")
                return Response(
                    {'error': f'You do not have permission to verify this payment. You own lots for owner {current_owner.id}, but this payment is for owner {lot_owner.id}'},
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


class OwnerPaymentsView(APIView):
    """
    Endpoint to fetch all payment receipts for owner's parking lots.
    Returns payments for all bookings in the owner's lots.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get all payments for owner's lots.
        
        Query params:
        - status: filter by status (SUCCESS, PENDING, FAILED)
        - payment_method: filter by method (Cash, UPI, CC)
        
        Returns:
        [
            {
                "pay_id": 1,
                "user_name": "John Doe",
                "lot_name": "Premium Lot",
                "payment_type": "Slot Payment",
                "payment_method": "UPI",
                "amount": "500.00",
                "status": "SUCCESS",
                "transaction_id": "TXN-123",
                "created_at": "2025-11-29T10:30:00Z"
            }
        ]
        """
        try:
            user = request.user
            
            # Check if user is owner or admin
            user_role = getattr(user, 'role', '').lower() if getattr(user, 'role', '') else ''
            
            if user.is_superuser or user_role == 'admin':
                # Admin can see all payments from all lots
                print(f"📋 Admin user fetching all payments")
                
                # Get all bookings
                bookings = Booking.objects.all()
                
                # Get all payments
                payments = Payment.objects.filter(
                    booking__in=bookings
                ).select_related('booking__user', 'booking__lot', 'booking__slot').order_by('-created_at')
                
            else:
                # Check if user is owner
                try:
                    owner = OwnerProfile.objects.get(auth_user=user)
                except OwnerProfile.DoesNotExist:
                    return Response(
                        {'error': 'Only parking lot owners or admins can access payments'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                print(f"📋 Fetching payments for owner: {owner.firstname} {owner.lastname}")
                
                # Get all lots owned by this owner
                owner_lots = P_Lot.objects.filter(owner=owner)
                lot_ids = list(owner_lots.values_list('lot_id', flat=True))
                
                print(f"   Owner has {len(lot_ids)} lots")
                
                # Get all bookings in owner's lots
                bookings = Booking.objects.filter(lot_id__in=lot_ids)
                
                # Get all payments for these bookings
                payments = Payment.objects.filter(
                    booking__in=bookings
                ).select_related('booking__user', 'booking__lot', 'booking__slot').order_by('-created_at')
            
            # Apply optional filters
            status_filter = request.query_params.get('status')
            if status_filter:
                payments = payments.filter(status=status_filter)
            
            method_filter = request.query_params.get('payment_method')
            if method_filter:
                payments = payments.filter(payment_method=method_filter)
            
            print(f"   Found {payments.count()} payments")
            
            # Format response data
            serializer = PaymentSerializer(payments, many=True)
            response_data = []
            
            for payment_data in serializer.data:
                booking = Payment.objects.get(pay_id=payment_data['pay_id']).booking
                user_profile = booking.user
                
                # Determine payment type based on order
                all_booking_payments = booking.payments.all().order_by('created_at')
                payment_list = list(all_booking_payments)
                payment_obj = Payment.objects.get(pay_id=payment_data['pay_id'])
                payment_index = list(all_booking_payments).index(payment_obj)
                payment_type = "Slot Payment" if payment_index == 0 else "Car Wash Payment"
                
                response_data.append({
                    'pay_id': payment_data['pay_id'],
                    'user_name': f"{user_profile.firstname} {user_profile.lastname}",
                    'lot_name': booking.lot.lot_name,
                    'slot_number': booking.slot.slot_id if booking.slot else 'N/A',
                    'slot_type': booking.slot.vehicle_type if booking.slot else 'Standard',
                    'payment_type': payment_type,
                    'payment_method': payment_data['payment_method'],
                    'amount': str(payment_data['amount']),
                    'status': payment_data['status'],
                    'transaction_id': payment_data['transaction_id'] or 'N/A',
                    'created_at': payment_data['created_at']
                })
            
            return Response({
                'count': len(response_data),
                'results': response_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error fetching owner payments: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Car Wash ViewSets

class CarWashServiceViewSet(ModelViewSet):
    """
    ViewSet for CarWashService master data.
    Provides endpoints to list available car wash services and their prices.
    """
    queryset = CarWashService.objects.filter(is_active=True)
    serializer_class = CarWashServiceSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Return only active car wash services"""
        return CarWashService.objects.filter(is_active=True)


class CarWashBookingViewSet(ModelViewSet):
    """
    ViewSet for CarWashBooking.
    Handles creation, retrieval, and management of car wash bookings.
    """
    serializer_class = CarWashBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users only see their own car wash bookings"""
        user = self.request.user
        try:
            user_profile = UserProfile.objects.get(auth_user=user)
            return CarWashBooking.objects.filter(user=user_profile).order_by('-booking_time')
        except UserProfile.DoesNotExist:
            return CarWashBooking.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new car wash booking with validation.
        User is automatically set from request.user.
        
        Validation Rules:
        1. Scheduled time must be in the future
        2. No double-bookings at same time/lot
        3. Minimum 30 minutes advance booking
        4. User must have active profile
        """
        print(f"\n{'='*60}")
        print(f"📋 Creating car wash booking with validation")
        print(f"📋 User: {request.user.username}")
        print(f"📋 Request DATA: {request.data}")
        
        try:
            user_profile = UserProfile.objects.get(auth_user=request.user)
            
            # Validation Rule 1: Check if scheduled_time is provided
            scheduled_time = request.data.get('scheduled_time')
            if not scheduled_time:
                print(f"❌ Validation failed: scheduled_time is required")
                print(f"{'='*60}\n")
                return Response(
                    {'error': 'Scheduled time is required for booking'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse scheduled_time
            from django.utils import timezone
            from datetime import datetime
            try:
                # Try parsing ISO format datetime string
                # Frontend sends ISO 8601 format like "2025-12-06T14:30:00"
                scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                # Make timezone-aware if naive
                if timezone.is_naive(scheduled_dt):
                    scheduled_dt = timezone.make_aware(scheduled_dt)
            except (ValueError, TypeError) as e:
                print(f"❌ Validation failed: Invalid scheduled_time format - {e}")
                print(f"{'='*60}\n")
                return Response(
                    {'error': 'Invalid scheduled_time format. Use ISO 8601 format (e.g., 2025-12-06T14:30:00)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validation Rule 2: Scheduled time must be in future
            now = timezone.now()
            if scheduled_dt <= now:
                print(f"❌ Validation failed: scheduled_time must be in the future")
                print(f"{'='*60}\n")
                return Response(
                    {'error': 'Scheduled time must be in the future'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validation Rule 3: Minimum 30 minutes advance booking
            min_advance = now + timedelta(minutes=30)
            if scheduled_dt < min_advance:
                print(f"❌ Validation failed: Booking must be at least 30 minutes in advance")
                print(f"{'='*60}\n")
                return Response(
                    {'error': 'Bookings must be made at least 30 minutes in advance'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validation Rule 4: Verify lot provides carwash service
            lot_id = request.data.get('lot')
            if lot_id:
                try:
                    lot = P_Lot.objects.get(lot_id=lot_id)
                    if not lot.provides_carwash:
                        print(f"❌ Validation failed: Lot does not provide carwash service")
                        print(f"{'='*60}\n")
                        return Response(
                            {'error': 'This parking lot does not provide car wash services'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except P_Lot.DoesNotExist:
                    print(f"❌ Validation failed: Lot not found")
                    print(f"{'='*60}\n")
                    return Response(
                        {'error': 'Parking lot not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Validation Rule 5: Check capacity limit (max 2 cars per time slot)
            # Time slot is defined as the hour in which the booking starts
            if lot_id:
                # Round down to nearest hour to get time slot
                slot_start = scheduled_dt.replace(minute=0, second=0, microsecond=0)
                slot_end = slot_start + timedelta(hours=1)
                
                # Count active bookings in this time slot
                capacity_per_slot = 2
                bookings_in_slot = CarWashBooking.objects.filter(
                    lot_id=lot_id,
                    scheduled_time__gte=slot_start,
                    scheduled_time__lt=slot_end,
                    status__in=['pending', 'confirmed', 'in_progress']
                ).exclude(status='cancelled').count()
                
                if bookings_in_slot >= capacity_per_slot:
                    print(f"❌ Validation failed: Time slot at capacity ({bookings_in_slot}/{capacity_per_slot})")
                    print(f"   Slot: {slot_start} to {slot_end}")
                    print(f"{'='*60}\n")
                    return Response(
                        {
                            'error': f'Time slot is full ({bookings_in_slot}/{capacity_per_slot} booked)',
                            'slot_time': slot_start.isoformat(),
                            'booked_count': bookings_in_slot,
                            'capacity': capacity_per_slot
                        },
                        status=status.HTTP_409_CONFLICT
                    )
                
                print(f"✅ Capacity check passed: {bookings_in_slot + 1}/{capacity_per_slot} slots")

            
            # All validations passed, proceed with creation
            data = dict(request.data)
            data['user'] = user_profile.id
            
            # Set payment_status based on payment method
            # - UPI/CC: Auto-verify (instant payment assumed)
            # - Cash: Pending (requires manual verification by owner)
            payment_method = request.data.get('payment_method', 'Cash')
            if 'payment_status' not in data:
                if payment_method in ['UPI', 'CC']:
                    data['payment_status'] = 'verified'  # Auto-verify online payments
                    print(f"📋 Auto-verifying {payment_method} payment")
                else:
                    data['payment_status'] = 'pending'  # Cash needs manual verification
                    print(f"📋 Cash payment set to pending (requires owner verification)")
            
            # Set default status if not provided  
            if 'status' not in data:
                data['status'] = 'pending'
            
            print(f"📋 Preparing data for serializer:")
            print(f"   service_type: {data.get('service_type')}")
            print(f"   lot: {data.get('lot')}")
            print(f"   user: {data.get('user')}")
            print(f"   price: {data.get('price')}")
            print(f"   payment_method: {data.get('payment_method')}")
            print(f"   payment_status: {data.get('payment_status')}")
            print(f"   status: {data.get('status')}")
            print(f"   transaction_id: {data.get('transaction_id')}")
            print(f"   notes: {data.get('notes')}")
            
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                print(f"❌ Serializer validation failed:")
                print(f"   Errors: {serializer.errors}")
                print(f"{'='*60}\n")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            
            print(f"✅ Car wash booking created: ID={serializer.data['carwash_booking_id']}")
            print(f"✅ Validations passed: time={scheduled_dt}, lot={lot_id}")
            print(f"{'='*60}\n")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except UserProfile.DoesNotExist:
            print(f"❌ User profile not found")
            print(f"{'='*60}\n")
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"❌ Unexpected error creating booking: {str(e)}")
            print(f"   Exception type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            print(f"{'='*60}\n")
            return Response(
                {'error': f'Error creating booking: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        """Save the car wash booking, assign employee, and schedule auto-completion"""
        from django.utils import timezone
        from datetime import timedelta
        import threading
        
        booking = serializer.save()
        
        # Smart employee assignment: Find available employee with least workload
        try:
            print(f"\n🔍 EMPLOYEE ASSIGNMENT FOR BOOKING {booking.carwash_booking_id}")
            print(f"   Lot: {booking.lot.lot_name}")
            print(f"   Owner: {booking.lot.owner}")
            
            available_employees = Employee.objects.filter(
                owner=booking.lot.owner,
                availability_status='available'
            ).order_by('current_assignments')
            
            print(f"   Available employees: {available_employees.count()}")
            
            employee = available_employees.first()
            
            if employee:
                # Assign employee to booking
                booking.employee = employee
                booking.save()
                
                # Update employee workload
                employee.current_assignments += 1
                if employee.current_assignments >= 3:  # Max 3 concurrent assignments
                    employee.availability_status = 'busy'
                employee.save()
                
                print(f"✅ Employee assigned: {employee.firstname} {employee.lastname}")
                print(f"   Employee ID: {employee.employee_id}")
                print(f"   Current assignments: {employee.current_assignments}")
                print(f"   Status: {employee.availability_status}")
            else:
                print(f"⚠️ No available employees found")
                print(f"   All employees are busy or offline")
        except Exception as e:
            print(f"❌ Employee assignment failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # Schedule auto-completion after 5 minutes for verified payments
        if booking.payment_status == 'verified':
            def auto_complete_booking():
                import time
                time.sleep(300)  # Wait 5 minutes (300 seconds)
                
                try:
                    # Refresh booking from database
                    booking.refresh_from_db()
                    
                    # Only auto-complete if still in pending or confirmed state
                    if booking.status in ['pending', 'confirmed']:
                        booking.status = 'completed'
                        booking.completed_time = timezone.now()
                        booking.save()
                        
                        print(f"✅ Auto-completed car wash booking {booking.carwash_booking_id}")
                        
                        # Send notification to user
                        try:
                            from channels.layers import get_channel_layer
                            from asgiref.sync import async_to_sync
                            
                            channel_layer = get_channel_layer()
                            user_id = booking.user.user.id
                            
                            notification_data = {
                                'type': 'send_notification',
                                'message': {
                                    'type': 'carwash_completed',
                                    'title': '🎉 Car Wash Complete!',
                                    'message': f'Your {booking.service_type} service has been completed. Your vehicle is ready!',
                                    'booking_id': booking.carwash_booking_id,
                                    'timestamp': timezone.now().isoformat()
                                }
                            }
                            
                            async_to_sync(channel_layer.group_send)(
                                f'user_{user_id}',
                                notification_data
                            )
                            print(f"📢 Sent completion notification to user {user_id}")
                        except Exception as notif_error:
                            print(f"⚠️ Failed to send notification: {str(notif_error)}")
                    
                except Exception as e:
                    print(f"❌ Auto-completion failed for booking {booking.carwash_booking_id}: {str(e)}")
            
            # Start auto-completion thread
            completion_thread = threading.Thread(target=auto_complete_booking, daemon=True)
            completion_thread.start()
            print(f"⏰ Scheduled auto-completion for booking {booking.carwash_booking_id} in 5 minutes")
    
    def perform_update(self, serializer):
        """Handle employee workload when booking status changes"""
        booking = self.get_object()
        old_status = booking.status
        
        updated_booking = serializer.save()
        new_status = updated_booking.status
        
        # Release employee when booking is completed or cancelled
        if old_status != new_status and new_status in ['completed', 'cancelled']:
            employee = updated_booking.employee
            if employee:
                print(f"\n🔄 RELEASING EMPLOYEE {employee.employee_id}")
                print(f"   Booking: {updated_booking.carwash_booking_id}")
                print(f"   Status change: {old_status} → {new_status}")
                print(f"   Current assignments: {employee.current_assignments}")
                
                employee.current_assignments = max(0, employee.current_assignments - 1)
                if employee.current_assignments < 3:
                    employee.availability_status = 'available'
                employee.save()
                
                print(f"✅ Employee released")
                print(f"   New assignments: {employee.current_assignments}")
                print(f"   New status: {employee.availability_status}\n")
    
    @action(detail=False, methods=['get'], url_path='available_time_slots', permission_classes=[permissions.AllowAny])
    def available_time_slots(self, request):
        """
        Get available time slots for a specific date and lot.
        Returns hourly slots from 9 AM to 8 PM with availability information.
        
        Query Parameters:
        - date: YYYY-MM-DD format (required)
        - lot_id: P_Lot ID (optional, if not provided shows all lots)
        """
        try:
            from django.utils import timezone
            from datetime import datetime, time, timedelta
            
            # Get query parameters
            date_str = request.query_params.get('date')
            lot_id = request.query_params.get('lot_id')
            
            print(f"🔍 Fetching time slots for date={date_str}, lot_id={lot_id}")
            
            if not date_str:
                return Response(
                    {'error': 'Date parameter is required (YYYY-MM-DD format)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse date
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                print(f"✅ Parsed date: {target_date}")
            except ValueError as e:
                print(f"❌ Date parsing error: {e}")
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Define time slots (9 AM to 8 PM, hourly)
            time_slots = []
            for hour in range(9, 21):  # 9 AM to 8 PM (20:00)
                time_slots.append(time(hour, 0))
            
            print(f"✅ Created {len(time_slots)} time slots")
            
            # Build response
            slots_data = []
            capacity_per_slot = 2  # Max 2 cars per time slot
            
            for slot_time in time_slots:
                try:
                    # Combine date and time
                    slot_datetime = timezone.make_aware(datetime.combine(target_date, slot_time))
                    slot_end = slot_datetime + timedelta(hours=1)
                    
                    # Count bookings for this time slot
                    query = CarWashBooking.objects.filter(
                        scheduled_time__gte=slot_datetime,
                        scheduled_time__lt=slot_end,
                        status__in=['pending', 'confirmed', 'in_progress']
                    ).exclude(status='cancelled')
                    
                    if lot_id:
                        try:
                            query = query.filter(lot_id=int(lot_id))
                        except (ValueError, TypeError) as e:
                            print(f"⚠️ Invalid lot_id: {lot_id}, error: {e}")
                    
                    booked_count = query.count()
                    available = booked_count < capacity_per_slot
                    
                    slots_data.append({
                        'time': slot_time.strftime('%H:%M'),
                        'available': available,
                        'booked_count': booked_count,
                        'capacity': capacity_per_slot,
                        'datetime': slot_datetime.isoformat()
                    })
                except Exception as slot_error:
                    print(f"❌ Error processing slot {slot_time}: {slot_error}")
                    import traceback
                    traceback.print_exc()
            
            print(f"✅ Returning {len(slots_data)} time slots")
            
            return Response({
                'date': date_str,
                'lot_id': lot_id,
                'slots': slots_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error in available_time_slots: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to fetch time slots: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update a car wash booking with status transition validation.
        
        Valid Status Transitions:
        - pending → confirmed (payment verified)
        - confirmed → in_progress (service started)
        - in_progress → completed (service done)
        - pending/confirmed/in_progress → cancelled (by user)
        """
        booking = self.get_object()
        new_status = request.data.get('status')
        
        print(f"\n{'='*60}")
        print(f"🔄 Updating car wash booking {booking.carwash_booking_id}")
        print(f"   Current status: {booking.status}")
        print(f"   New status: {new_status}")
        
        if new_status and new_status != booking.status:
            # Validate status transition
            valid_transitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['in_progress', 'cancelled'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],  # No transitions from completed
                'cancelled': [],  # No transitions from cancelled
            }
            
            allowed_next_states = valid_transitions.get(booking.status, [])
            if new_status not in allowed_next_states:
                print(f"❌ Invalid status transition: {booking.status} → {new_status}")
                print(f"   Allowed transitions: {allowed_next_states}")
                print(f"{'='*60}\n")
                return Response(
                    {
                        'error': f'Invalid status transition from {booking.status} to {new_status}',
                        'allowed_transitions': allowed_next_states
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Additional validation for specific transitions
            if new_status == 'completed' and booking.payment_status != 'verified':
                print(f"❌ Cannot complete booking: payment not verified")
                print(f"{'='*60}\n")
                return Response(
                    {'error': 'Cannot complete booking until payment is verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if new_status == 'in_progress':
                # Set started time
                from django.utils import timezone
                request.data._mutable = True
                request.data['started_time'] = timezone.now().isoformat()
            
            if new_status == 'completed':
                # Set completed time
                from django.utils import timezone
                request.data._mutable = True
                request.data['completed_time'] = timezone.now().isoformat()
            
            print(f"✅ Valid transition allowed")
        
        # Perform the update
        serializer = self.get_serializer(booking, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        print(f"✅ Booking updated successfully")
        print(f"{'='*60}\n")
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-bookings', permission_classes=[permissions.IsAuthenticated])
    def my_bookings(self, request):
        """Get all car wash bookings for the current user"""
        try:
            user_profile = UserProfile.objects.get(auth_user=request.user)
            bookings = CarWashBooking.objects.filter(user=user_profile).order_by('-booking_time')
            serializer = self.get_serializer(bookings, many=True)
            
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='pending-payments', permission_classes=[permissions.IsAuthenticated])
    def pending_payments(self, request):
        """Get car wash bookings with pending payment status"""
        try:
            user_profile = UserProfile.objects.get(auth_user=request.user)
            bookings = CarWashBooking.objects.filter(
                user=user_profile,
                payment_status='pending'
            ).order_by('-booking_time')
            serializer = self.get_serializer(bookings, many=True)
            
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class OwnerCarWashBookingViewSet(ModelViewSet):
    """
    ViewSet for owners to view car wash bookings for their lots.
    Only owners can access car wash bookings for their own parking lots.
    """
    serializer_class = CarWashBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Owners only see car wash bookings for their lots"""
        user = self.request.user
        try:
            owner_profile = OwnerProfile.objects.get(auth_user=user)
            # Get all lots owned by this owner
            owner_lots = P_Lot.objects.filter(owner=owner_profile)
            # Get all car wash bookings for these lots
            return CarWashBooking.objects.filter(lot__in=owner_lots).order_by('-booking_time')
        except OwnerProfile.DoesNotExist:
            return CarWashBooking.objects.none()
    
    def perform_update(self, serializer):
        """Handle employee workload when booking status changes"""
        booking = self.get_object()
        old_status = booking.status
        
        updated_booking = serializer.save()
        new_status = updated_booking.status
        
        # Release employee when booking is completed or cancelled
        if old_status != new_status and new_status in ['completed', 'cancelled']:
            employee = updated_booking.employee
            if employee:
                print(f"\n🔄 RELEASING EMPLOYEE {employee.employee_id}")
                print(f"   Booking: {updated_booking.carwash_booking_id}")
                print(f"   Status change: {old_status} → {new_status}")
                print(f"   Current assignments: {employee.current_assignments}")
                
                employee.current_assignments = max(0, employee.current_assignments - 1)
                if employee.current_assignments < 3:
                    employee.availability_status = 'available'
                employee.save()
                
                print(f"✅ Employee released")
                print(f"   New assignments: {employee.current_assignments}")
                print(f"   New status: {employee.availability_status}\n")
    
    @action(detail=False, methods=['get'], url_path='dashboard', permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        """
        Get car wash dashboard stats for owner.
        Includes total bookings, revenue, pending verifications, etc.
        """
        try:
            owner_profile = OwnerProfile.objects.get(auth_user=request.user)
            owner_lots = P_Lot.objects.filter(owner=owner_profile)
            
            bookings = CarWashBooking.objects.filter(lot__in=owner_lots)
            total_bookings = bookings.count()
            completed_bookings = bookings.filter(status='completed').count()
            pending_payments = bookings.filter(payment_status='pending').count()
            
            # Calculate total revenue
            total_revenue = 0
            for booking in bookings.filter(status='completed', payment_status='verified'):
                total_revenue += float(booking.price)
            
            return Response({
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'pending_payments': pending_payments,
                'total_revenue': total_revenue,
            }, status=status.HTTP_200_OK)
        except OwnerProfile.DoesNotExist:
            return Response(
                {'error': 'Owner profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], url_path='verify-payment', permission_classes=[permissions.IsAuthenticated])
    def verify_payment(self, request, pk=None):
        """
        Verify cash payment for a car wash booking.
        Only works for Cash payments and changes payment_status from 'pending' to 'verified'.
        
        Permission: Only the owner of the lot can verify payments.
        """
        try:
            # Check if booking exists
            try:
                booking = self.get_object()
            except Exception as e:
                return Response(
                    {'error': 'Booking not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Security check: Verify owner owns this lot
            owner_profile = OwnerProfile.objects.get(auth_user=request.user)
            if booking.lot and booking.lot.owner != owner_profile:
                return Response(
                    {'error': 'You do not have permission to verify this booking'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Only Cash payments can be manually verified
            if booking.payment_method != 'Cash':
                return Response(
                    {
                        'error': f'Only Cash payments can be verified manually. This booking uses {booking.payment_method}',
                        'payment_method': booking.payment_method
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already verified
            if booking.payment_status == 'verified':
                return Response(
                    {'message': 'Payment is already verified', 'payment_status': booking.payment_status},
                    status=status.HTTP_200_OK
                )
            
            # Mark payment as verified
            booking.payment_status = 'verified'
            booking.save()
            
            print(f"✅ Cash payment verified for booking {booking.carwash_booking_id}")
            print(f"   User: {booking.user.firstname} {booking.user.lastname}")
            print(f"   Amount: ₹{booking.price}")
            
            # Send WebSocket notification to user
            try:
                send_ws_notification(
                    booking.user.auth_user.id,
                    'success',
                    f'Your car wash payment has been verified by the lot owner.'
                )
            except Exception as e:
                print(f"⚠️ Could not send notification: {str(e)}")
            
            serializer = self.get_serializer(booking)
            return Response(
                {
                    'message': 'Cash payment verified successfully',
                    'booking': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except CarWashBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except OwnerProfile.DoesNotExist:
            return Response(
                {'error': 'Owner profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            print(f"❌ Error verifying payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'], url_path='confirm-booking', permission_classes=[permissions.IsAuthenticated])
    def confirm_booking(self, request, pk=None):
        """
        Confirm a car wash booking.
        Changes status from 'pending' to 'confirmed'.
        Only allows confirmation if payment is verified.
        
        Permission: Only the owner of the lot can confirm bookings.
        """
        try:
            # Check if booking exists
            try:
                booking = self.get_object()
            except Exception as e:
                return Response(
                    {'error': 'Booking not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Security check: Verify owner owns this lot
            owner_profile = OwnerProfile.objects.get(auth_user=request.user)
            if booking.lot and booking.lot.owner != owner_profile:
                return Response(
                    {'error': 'You do not have permission to confirm this booking'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if payment is verified
            if booking.payment_status != 'verified':
                return Response(
                    {
                        'error': f'Cannot confirm booking. Payment status is {booking.payment_status}. Payment must be verified first.',
                        'payment_status': booking.payment_status
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already confirmed
            if booking.status == 'confirmed':
                return Response(
                    {'message': 'Booking is already confirmed', 'status': booking.status},
                    status=status.HTTP_200_OK
                )
            
            # Mark booking as confirmed
            old_status = booking.status
            booking.status = 'confirmed'
            booking.save()
            
            print(f"✅ Car wash booking confirmed: {booking.carwash_booking_id}")
            print(f"   Status: {old_status} → confirmed")
            print(f"   User: {booking.user.firstname} {booking.user.lastname}")
            print(f"   Service: {booking.service_type}")
            print(f"   Scheduled: {booking.scheduled_time}")
            
            # Send WebSocket notification to user
            try:
                send_ws_notification(
                    booking.user.auth_user.id,
                    'success',
                    f'Your car wash booking has been confirmed! Scheduled for {booking.scheduled_time.strftime("%d %b %Y, %H:%M") if booking.scheduled_time else "TBD"}.'
                )
            except Exception as e:
                print(f"⚠️ Could not send notification: {str(e)}")
            
            serializer = self.get_serializer(booking)
            return Response(
                {
                    'message': 'Booking confirmed successfully',
                    'booking': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except CarWashBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except OwnerProfile.DoesNotExist:
            return Response(
                {'error': 'Owner profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            print(f"❌ Error confirming booking: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ===== USER BOOKED LOTS (For Reviews) =====
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_booked_lots(request):
    """
    Returns all parking lots where the logged-in user has completed bookings.
    Includes BOTH:
    - Lots where user booked a parking slot (Booking model)
    - Lots where user booked a standalone carwash service (CarWashBooking model)
    
    Used to populate the "Select Parking Lot" dropdown in the Review form.
    """
    try:
        user = request.user
        print(f"📍 Fetching completed bookings for user: {user.username}")
        
        # Get user profile
        try:
            user_profile = UserProfile.objects.get(auth_user=user)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get lots from completed SLOT bookings
        slot_bookings = Booking.objects.filter(
            user=user_profile,
            status__iexact='completed'
        ).select_related('lot')
        
        slot_lot_ids = set(slot_bookings.values_list('lot_id', flat=True))
        print(f"   Slot bookings: {slot_bookings.count()} completed bookings")
        print(f"   Slot lots: {len(slot_lot_ids)} unique lots - {list(slot_lot_ids)}")
        
        # Get lots from completed CARWASH bookings
        carwash_bookings = CarWashBooking.objects.filter(
            user=user_profile,
            status='completed',
            lot__isnull=False  # Only include carwash bookings that have a lot assigned
        ).select_related('lot')
        
        carwash_lot_ids = set(carwash_bookings.values_list('lot_id', flat=True))
        print(f"   Carwash bookings: {carwash_bookings.count()} completed bookings")
        print(f"   Carwash lots: {len(carwash_lot_ids)} unique lots - {list(carwash_lot_ids)}")
        
        # Combine both sets (union) to get unique lot IDs
        combined_lot_ids = slot_lot_ids | carwash_lot_ids
        print(f"   ✅ Total unique reviewable lots: {len(combined_lot_ids)} - {list(combined_lot_ids)}")
        
        # Get lot details
        lots = P_Lot.objects.filter(lot_id__in=list(combined_lot_ids))
        print(f"   P_Lot query results: {lots.count()} lots")
        for lot in lots:
            print(f"     - Lot {lot.lot_id}: {lot.lot_name}")
        
        serializer = P_LotSerializer(lots, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error fetching user booked lots: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )