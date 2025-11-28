from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from .models import (
    AuthUser,
    UserProfile,
    OwnerProfile,
    P_Lot,
    P_Slot,
    Booking,
    Payment,
    Carwash,
    Carwash_type,
    Review,
    Employee,
    Tasks,
    VEHICLE_CHOICES,
    BOOKING_CHOICES,
    PAYMENT_CHOICES,
)


# Auth and register Serializer
class UserRegisterSerializer(serializers.Serializer):

    username = serializers.CharField()
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    firstname = serializers.CharField()
    lastname = serializers.CharField()
    phone = serializers.CharField()
    vehicle_number = serializers.CharField()
    vehicle_type = serializers.ChoiceField(choices=VEHICLE_CHOICES)

    def validate_username(self, value):
        if AuthUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if AuthUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.pop("username")
        email = validated_data.pop("email")
        password = validated_data.pop("password")  # Extract auth fields

        user = AuthUser.objects.create_user(
            username=username,
            email=email,
            password=password,  # Create AuthUser
            role="User",
        )

        UserProfile.objects.create(
            auth_user=user,
            firstname=validated_data.pop("firstname"),
            lastname=validated_data.pop("lastname"),  # Create UserProfile
            phone=validated_data.pop("phone"),
            vehicle_number=validated_data.pop("vehicle_number"),
            vehicle_type=validated_data.pop("vehicle_type"),
        )
        return user


# Owner serializer
class OwnerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    firstname = serializers.CharField()
    lastname = serializers.CharField()
    phone = serializers.CharField()
    streetname = serializers.CharField()
    locality = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()
    verification_document_image = serializers.ImageField()
    verification_status = serializers.CharField(
        source="get_verification_status_display", required=False, allow_null=True)

    def validate_username(self, value):
        if AuthUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if AuthUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value


    def create(self, validated_data):
        username = validated_data.pop("username")
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        user = AuthUser.objects.create_user(
            username=username, 
            email=email, 
            password=password, 
            role="Owner"
        )

        OwnerProfile.objects.create(
            auth_user=user,
            firstname=validated_data.pop("firstname"),
            lastname=validated_data.pop("lastname"),
            phone=validated_data.pop("phone"),
            streetname=validated_data.pop("streetname"),
            locality=validated_data.pop("locality"),
            city=validated_data.pop("city"),
            state=validated_data.pop("state"),
            pincode=validated_data.pop("pincode"),
            verification_document_image=validated_data.get(
                "verification_document_image", None),
            verification_status="PENDING",
        )
        return user


# login Serializer
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password")

        attrs["user"] = user
        return attrs


# Profiles
class UserProfileSerializer(serializers.ModelSerializer):
    auth_user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "auth_user",
            "firstname",
            "lastname",
            "phone",
            "vehicle_number",
            "vehicle_type",
        ]
        read_only_fields = ["id", "auth_user"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["auth_user"] = request.user
        return super().create(validated_data)


class OwnerProfileSerializer(serializers.ModelSerializer):
    auth_user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = OwnerProfile
        fields = [
            "id",
            "auth_user",
            "firstname",
            "lastname",
            "phone",
            "streetname",
            "locality",
            "city",
            "state",
            "pincode",
            "verification_status",
            "verification_document_image",
        ]
        read_only_fields = [
            "id",
            "auth_user",
        ]


class P_LotSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=OwnerProfile.objects.all(), required=False)
    available_slots=serializers.SerializerMethodField()    
    class Meta:
        model = P_Lot
        fields = [
            "lot_id",
            "owner",
            "lot_name",
            "streetname",
            "locality",
            "city",
            "state",
            "pincode",
            "latitude",
            "longitude",
            "total_slots",
            "available_slots",
        ]
    def get_available_slots(self, obj):
        try:
            return obj.slots.filter(is_available=True).count()
        except:
            return 0    

    read_only_fields = ["lot_id", "available_slots"]


# P_Slot serializer
class PLotNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = P_Lot
        fields = [
            "lot_id",
            "lot_name",
            "streetname",
            "city",
            "pincode",
            "total_slots",
            "available_slots",
        ]


class P_SlotSerializer(serializers.ModelSerializer):
    lot_detail = PLotNestedSerializer(source="lot",read_only=True)
    lot = serializers.PrimaryKeyRelatedField(queryset=P_Lot.objects.all(), write_only=True)
    vehicle_type = serializers.ChoiceField(choices=VEHICLE_CHOICES)
    # Include booking details so frontend can calculate timer from end_time
    booking = serializers.SerializerMethodField()

    class Meta:
        model = P_Slot
        fields = ["slot_id", "lot_detail", "lot", "vehicle_type", "price", "is_available", "booking"]
    
    def get_booking(self, obj):
        """Get active booking for this slot if any"""
        from django.utils import timezone
        # Get the most recent booking for this slot using the correct related_name
        # Support both old 'booked' and new 'ACTIVE'/'SCHEDULED' statuses
        bookings = obj.booking_of_slot.filter(
            status__in=['booked', 'BOOKED', 'ACTIVE', 'SCHEDULED']
        ).order_by('-booking_time')
        
        if bookings.exists():
            booking = bookings.first()
            now = timezone.now()
            
            # ✅ Check if booking has expired
            # If expired, don't return it (slot is available)
            # The view-level cleanup will mark it as COMPLETED
            if booking.end_time and booking.end_time <= now:
                # Booking has expired - return None so slot shows as available
                return None
            
            return {
                'booking_id': booking.booking_id,
                'start_time': booking.start_time,
                'end_time': booking.end_time,
                'status': booking.status
            }
        return None


# Booking Serializer
class UserProfileNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "firstname", "lastname", "vehicle_number"]

class PLotNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = P_Lot
        fields = ["lot_id", "lot_name", "latitude", "longitude"]

class PSlotNestedSerializer(serializers.ModelSerializer):
    lot_detail = PLotNestedSerializer(source="lot", read_only=True)
    
    class Meta:
        model = P_Slot
        fields = [
            "slot_id",
            "price",
            "vehicle_type",
            "is_available",
            "lot_detail",
        ]

class CarwashTypeNestedSerializer(serializers.ModelSerializer):
    """Nested serializer for carwash type details"""
    class Meta:
        model = Carwash_type
        fields = [
            "carwash_type_id",
            "name",
            "description",
            "price"
        ]


class CarwashNestedSerializer(serializers.ModelSerializer):
    """Nested serializer to include carwash details in booking"""
    carwash_type_detail = CarwashTypeNestedSerializer(source="carwash_type", read_only=True)
    
    class Meta:
        model = Carwash
        fields = [
            "carwash_id",
            "carwash_type",
            "carwash_type_detail",
            "employee",
            "price"
        ]


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    lot = serializers.PrimaryKeyRelatedField(read_only=True)
    slot = serializers.PrimaryKeyRelatedField(
        queryset=P_Slot.objects.filter(is_available=True)
    )
    booking_type = serializers.ChoiceField(BOOKING_CHOICES)
    user_read = UserProfileNestedSerializer(source="user", read_only=True)
    lot_detail = serializers.SerializerMethodField()
    slot_read = PSlotNestedSerializer(source="slot", read_only=True)
    is_expired = serializers.SerializerMethodField()
    remaining_time = serializers.SerializerMethodField()
    carwash = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "booking_id",
            "user",
            "user_read",
            "slot",
            "slot_read",
            "lot",
            "lot_detail",
            "vehicle_number",
            "booking_type",
            "booking_time",
            "start_time",
            "end_time",
            "price",
            "status",
            "is_expired",
            "remaining_time",
            "carwash",
        ]

    read_only_fields = ["booking_id", "price", "booking_time", "lot", "start_time", "end_time", "is_expired", "remaining_time", "carwash"]

    def get_lot_detail(self, obj):
        """Get lot details from the slot"""
        if obj.slot and obj.slot.lot:
            serializer = PLotNestedSerializer(obj.slot.lot)
            return serializer.data
        return None

    def get_is_expired(self, obj):
        """Check if booking has expired"""
        return obj.is_expired()
    
    def get_remaining_time(self, obj):
        """Calculate remaining time in seconds until booking expires"""
        from django.utils import timezone
        if obj.end_time and obj.status.lower() == 'booked':
            remaining = (obj.end_time - timezone.now()).total_seconds()
            return max(0, int(remaining))  # Return seconds, max 0
        return 0

    def get_carwash(self, obj):
        """Get the first active carwash service for this booking, if any"""
        carwash = obj.booking_by_user.first()
        if carwash:
            return CarwashNestedSerializer(carwash).data
        return None

    def validate_slot(self, value):
        if not value.is_available:
            raise serializers.ValidationError("Selected slot is not available.")
        return value

    def create(self, validated_data, **kwargs):
        """Create a booking with support for extra fields from perform_create"""
        request = self.context.get("request")
        auth_user = request.user
        user_profile = UserProfile.objects.get(auth_user=auth_user)
        slot = validated_data.get("slot") or kwargs.get("slot")
        
        # Get extra fields from kwargs (passed by perform_create)
        start_time = kwargs.get("start_time")
        end_time = kwargs.get("end_time")
        status = kwargs.get("status", "booked")  # Default to 'booked' if not specified

        with transaction.atomic():
            price = slot.price
            booking = Booking.objects.create(
                user=user_profile,
                slot=slot,
                lot=slot.lot,
                vehicle_number=validated_data["vehicle_number"],
                booking_type=validated_data["booking_type"],
                start_time=start_time,
                end_time=end_time,
                status=status,
                price=price,
            )
            slot.is_available = False
            slot.save()
        return booking


# Payment Serializer
# class PaymentUserNestedSerializer(serializers.ModelSerializer):
# class Meta:
# model=UserProfile
# fields=['user_id','firstname','lastname','email']
class PaymentBookingNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "booking_id",
            "booking_type",
            "price",
            "vehicle_number",
            "booking_type",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    booking = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all())
    booking_read = PaymentBookingNestedSerializer(source="booking", read_only=True)
    payment_method = serializers.ChoiceField(choices=PAYMENT_CHOICES)

    # user=PaymentUserNestedSerializer(read_only=True)
    # user_id=serializers.PrimaryKeyRelatedField(queryset=UserProfile.objects.all(),write_only=True)
    class Meta:
        model = Payment
        fields = [
            "pay_id",
            "booking_read",
            "booking",
            "user",
            "payment_method",
            "amount",
        ]
        read_only_fields = ["pay_id", "amount","user"]


# Services Serializer
# class SimplePLotSerializer(serializers.ModelSerializer):
# class Meta:
# model=P_Lot
# fields=['lot_id','lot_name','latitude','longitude']

# class ServicesSerializer(serializers.ModelSerializer):
# lot_id=serializers.PrimaryKeyRelatedField(queryset=P_Lot.objects.all())
# service_name=serializers.CharField(max_length=100,default='Carwash')


# class Meta:
# model=Services
# fields=[
#'service_id',
#'lot_id',
#'service_name',
#'description',
#'price'
# ]
# Carwashtype serializer
class CarwashTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carwash_type
        fields = ["name", "carwash_type_id", "description", "price"]


# Employee serializer
class EmployeeSerializer(serializers.ModelSerializer):
    owner_detail = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            "employee_id",
            "firstname",
            "lastname",
            "phone",
            "latitude",
            "longitude",
            "driving_license",
            "driving_license_image",
            "owner",
            "owner_detail",
        ]

        read_only_fields = ["employee_id"]
    
    def get_owner_detail(self, obj):
        if obj.owner:
            return {
                'id': obj.owner.id,
                'firstname': obj.owner.firstname,
                'lastname': obj.owner.lastname,
                'phone': obj.owner.phone
            }
        return None

# Carwash serializer
class CarwashBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model= Booking
        fields = ["booking_id", "booking_type", "price", "booking_time", "start_time", "end_time", "status", "vehicle_number", "is_expired"]


class EmployeeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["employee_id", "firstname", "lastname", "latitude", "longitude"]


class CarwashTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carwash_type
        fields = ["carwash_type_id", "name", "price"]


class CarwashUserNestedSerializer(serializers.ModelSerializer):
    """Nested user data for carwash"""
    class Meta:
        model = UserProfile
        fields = ["id", "firstname", "lastname", "phone", "vehicle_number"]


class CarwashLotNestedSerializer(serializers.ModelSerializer):
    """Nested lot data for carwash"""
    class Meta:
        model = P_Lot
        fields = ["lot_id", "lot_name", "streetname", "locality", "city"]


class CarwashSlotNestedSerializer(serializers.ModelSerializer):
    """Nested slot data for carwash"""
    class Meta:
        model = P_Slot
        fields = ["slot_id", "vehicle_type", "price"]


class CarwashSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), allow_null=True, required=False
    )
    booking = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all())
    carwash_type = serializers.PrimaryKeyRelatedField(queryset=Carwash_type.objects.all()
    )
    employee_read = EmployeeNestedSerializer(source="employee", read_only=True)
    booking_read = CarwashBookingSerializer(source="booking", read_only=True)
    carwash_type_read = CarwashTypeNestedSerializer(source="carwash_type", read_only=True)
    
    # Enhanced: Add user, lot, and slot details
    user_read = serializers.SerializerMethodField()
    lot_read = serializers.SerializerMethodField()
    slot_read = serializers.SerializerMethodField()

    class Meta:
        model = Carwash
        fields = [
            "carwash_id",
            "booking",
            "booking_read",
            "employee",
            "employee_read",
            "carwash_type",
            "carwash_type_read",
            "price",
            "user_read",
            "lot_read",
            "slot_read",
        ]
        read_only_fields = ["carwash_id", "price"]

    def get_user_read(self, obj):
        """Extract user details from booking"""
        if obj.booking and obj.booking.user:
            serializer = CarwashUserNestedSerializer(obj.booking.user)
            return serializer.data
        return None

    def get_lot_read(self, obj):
        """Extract lot details from booking"""
        if obj.booking and obj.booking.lot:
            serializer = CarwashLotNestedSerializer(obj.booking.lot)
            return serializer.data
        return None

    def get_slot_read(self, obj):
        """Extract slot details from booking"""
        if obj.booking and obj.booking.slot:
            serializer = CarwashSlotNestedSerializer(obj.booking.slot)
            return serializer.data
        return None

    def create(self, validated_data):
        carwash_type = validated_data["carwash_type"]
        validated_data["price"] = carwash_type.price

        return Carwash.objects.create(**validated_data)


# Tasks Serializer
class TasksBookingNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["booking_id", "booking_type", "price"]


class TasksEmployeeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["employee_id", "firstname", "lastname", "latitude", "longitude"]


class TasksSerializer(serializers.ModelSerializer):
    booking = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.all(), write_only=True
    )
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    booking_read = TasksBookingNestedSerializer(source="booking", read_only=True)
    employee_read = TasksEmployeeNestedSerializer(source="employee", read_only=True)

    class Meta:
        model = Tasks
        fields = [
            "task_id",
            "booking",
            "booking_read",
            "employee_read",
            "employee",
            "task_type",
        ]


# Review serializer
class ReviewUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "firstname", "lastname"]


class ReviewPLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = P_Lot
        fields = ["lot_id", "lot_name", "latitude", "longitude"]


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    lot = serializers.PrimaryKeyRelatedField(queryset=P_Lot.objects.all())
    user_detail = ReviewUserSerializer(source="user",read_only=True)
    lot_detail = ReviewPLotSerializer(source="lot",read_only=True)

    class Meta:
        model = Review
        fields = [
            "rev_id",
            "user_detail",
            "lot_detail",
            "user",
            "lot", "rating",
            "review_desc",
        ]
