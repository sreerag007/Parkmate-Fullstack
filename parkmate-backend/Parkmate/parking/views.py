from rest_framework import viewsets
from rest_framework.viewsets import ViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(auth_user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        profile=UserProfile.objects.get(auth_user=request.user)
        serializer=self.get_serializer(profile,data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
class OwnerProfileViewSet(ModelViewSet):
    queryset=OwnerProfile.objects.all()
    serializer_class=OwnerProfileSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return OwnerProfile.objects.filter(auth_user=self.request.user)

    def update(self, request, *args, **kwargs):
        profile=OwnerProfile.objects.get(auth_user=request.user)
        serializer=self.get_serializer(profile,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)    


#P_LotViewsets
class P_LotVIewSet(ModelViewSet):
    serializer_class=P_LotSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user

        if user.role =="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return P_Lot.objects.filter(owner=owner)
        return P_Lot.objects.filter(owner__verification_status="Approved")
    
    def perform_create(self, serializer):
        owner=OwnerProfile.objects.get(auth_user=self.request.user)
        serializer.save(owner=owner)

#P_SlotViewsets
class P_SlotViewSet(ModelViewSet):
    serializer_class=P_SlotSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user= self.request.user
        if user.role=="Owner":
            owner=OwnerProfile.objects.get(auth_user=user)
            return P_Slot.objects.filter(lot__owner=owner)
        return P_Slot.objects.filter(lot__owner__verification_status="Approved")
    
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
        if self.request.user.role=="Admin":
            return Carwash_type.objects.all()
        return Carwash_type.objects.none()


class EmployeeViewSet(ModelViewSet):
    serializer_class=EmployeeSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user=self.request.user
        if user.is_superuser or getattr(user,'role','')=='Admin':
            return Employee.objetcs.all()
        
        if getattr(user, 'role','')=='Owner':
            try:
                owner=OwnerProfile.objects.get(auth_user=user)
                return Employee.objects.filter(owner=owner)
            except OwnerProfile.DoesNotExist:
                return Employee.objects.none()
        
        return Employee.objects.none()
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
            owner=OwnerProfile.objetcs.get(auth_user=user)
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

