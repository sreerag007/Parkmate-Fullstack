from rest_framework import viewsets
from rest_framework.viewsets import ViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework import serializers
from django.contrib.auth import logout, authenticate
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser

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
            return Booking.objects.filter(lot__owner=owner)
        return Booking.objects.all()
        
    def perform_create(self, serializer):
        return serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        # Only admin can update booking status
        if user.role != "admin":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can update booking status")
        return serializer.save()

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

