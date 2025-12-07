from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Avg
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
    CarWashBooking,
    CarWashService,
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
    driving_license = serializers.ImageField(required=False, allow_null=True)

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
        driving_license = validated_data.pop("driving_license", None)  # Extract optional field

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
            driving_license=driving_license,  # Save driving license image
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
    username = serializers.CharField(source='auth_user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "auth_user",
            "username",
            "firstname",
            "lastname",
            "phone",
            "vehicle_number",
            "vehicle_type",
            "driving_license",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "auth_user", "username", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["auth_user"] = request.user
        return super().create(validated_data)


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for admin user management.
    Includes comprehensive stats about bookings, payments, and reviews.
    """
    auth_user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(source='auth_user.username', read_only=True)
    email = serializers.EmailField(source='auth_user.email', read_only=True)
    is_active = serializers.BooleanField(source='auth_user.is_active', read_only=True)
    date_joined = serializers.DateTimeField(source='auth_user.date_joined', read_only=True)
    
    # Booking statistics
    total_slot_bookings = serializers.SerializerMethodField()
    total_carwash_bookings = serializers.SerializerMethodField()
    last_booking_date = serializers.SerializerMethodField()
    
    # Payment statistics
    total_transactions = serializers.SerializerMethodField()
    total_amount_spent = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()
    
    # Review statistics
    total_reviews = serializers.SerializerMethodField()
    average_rating_given = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "auth_user",
            "username",
            "email",
            "is_active",
            "date_joined",
            "firstname",
            "lastname",
            "phone",
            "vehicle_number",
            "vehicle_type",
            "driving_license",
            "created_at",
            "updated_at",
            "total_slot_bookings",
            "total_carwash_bookings",
            "last_booking_date",
            "total_transactions",
            "total_amount_spent",
            "last_payment_date",
            "total_reviews",
            "average_rating_given",
        ]
        read_only_fields = ["id", "auth_user", "username", "email", "is_active", "date_joined", "created_at", "updated_at"]
    
    def get_total_slot_bookings(self, obj):
        """Count total slot bookings"""
        from parking.models import Booking
        return Booking.objects.filter(user=obj).count()
    
    def get_total_carwash_bookings(self, obj):
        """Count total carwash bookings (both add-on and standalone)"""
        from parking.models import Carwash, CarWashBooking
        addon_count = Carwash.objects.filter(booking__user=obj).count()
        standalone_count = CarWashBooking.objects.filter(user=obj).count()
        return addon_count + standalone_count
    
    def get_last_booking_date(self, obj):
        """Get the most recent booking date"""
        from parking.models import Booking, CarWashBooking
        from django.db.models import Max
        
        slot_booking = Booking.objects.filter(user=obj).aggregate(Max('booking_time'))['booking_time__max']
        carwash_booking = CarWashBooking.objects.filter(user=obj).aggregate(Max('booking_time'))['booking_time__max']
        
        # Return the most recent of the two
        if slot_booking and carwash_booking:
            return max(slot_booking, carwash_booking)
        return slot_booking or carwash_booking
    
    def get_total_transactions(self, obj):
        """Count total payment transactions"""
        from parking.models import Payment
        return Payment.objects.filter(user=obj).count()
    
    def get_total_amount_spent(self, obj):
        """Calculate total amount spent across all payments"""
        from parking.models import Payment
        from django.db.models import Sum
        
        total = Payment.objects.filter(user=obj, status='SUCCESS').aggregate(Sum('amount'))['amount__sum']
        return float(total) if total else 0.00
    
    def get_last_payment_date(self, obj):
        """Get the most recent payment date"""
        from parking.models import Payment
        
        last_payment = Payment.objects.filter(user=obj).order_by('-created_at').first()
        return last_payment.created_at if last_payment else None
    
    def get_total_reviews(self, obj):
        """Count total reviews submitted"""
        from parking.models import Review
        return Review.objects.filter(user=obj).count()
    
    def get_average_rating_given(self, obj):
        """Calculate average rating given by user"""
        from parking.models import Review
        from django.db.models import Avg
        
        avg_rating = Review.objects.filter(user=obj).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg_rating), 2) if avg_rating else 0.00


class OwnerProfileSerializer(serializers.ModelSerializer):
    auth_user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(source='auth_user.username', read_only=True)

    class Meta:
        model = OwnerProfile
        fields = [
            "id",
            "auth_user",
            "username",
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
            "provides_carwash",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "auth_user",
            "username",
            "created_at",
            "updated_at",
        ]


class OwnerDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for admin owner management.
    Includes comprehensive stats about lots and services.
    """
    auth_user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(source='auth_user.username', read_only=True)
    verification_document_image = serializers.SerializerMethodField()
    
    # Statistics
    total_lots = serializers.SerializerMethodField()
    total_available_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = OwnerProfile
        fields = [
            "id",
            "auth_user",
            "username",
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
            "provides_carwash",
            "created_at",
            "updated_at",
            "total_lots",
            "total_available_slots",
        ]
        read_only_fields = [
            "id",
            "auth_user",
            "username",
            "created_at",
            "updated_at",
        ]
    
    def get_verification_document_image(self, obj):
        """Get URL for verification document image"""
        if obj.verification_document_image:
            # Return just the URL path (e.g., /media/verification_documents/file.jpg)
            return obj.verification_document_image.url
        return None
    
    def get_total_lots(self, obj):
        """Count total lots owned"""
        from parking.models import P_Lot
        return P_Lot.objects.filter(owner=obj).count()
    
    def get_total_available_slots(self, obj):
        """Calculate total available slots across all lots"""
        from parking.models import P_Lot, Booking
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        
        lots = P_Lot.objects.filter(owner=obj)
        total_available = 0
        
        for lot in lots:
            # Count booked slots (not expired and not cancelled)
            booked_count = Booking.objects.filter(
                lot=lot,
                status__in=['BOOKED', 'EXTENDED']
            ).filter(
                Q(end_time__gte=timezone.now()) | Q(end_time__isnull=True)
            ).count()
            
            available = lot.total_slots - booked_count
            total_available += max(0, available)
        
        return total_available


class P_LotSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=OwnerProfile.objects.all(), required=False)
    available_slots=serializers.SerializerMethodField()
    lot_image_url = serializers.SerializerMethodField()  # Read-only URL output
    avg_rating = serializers.SerializerMethodField()
    
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
            "lot_image",  # Writable field for uploads
            "lot_image_url",  # Read-only URL field
            "avg_rating",
            "provides_carwash",  # New field for carwash service availability
        ]
    
    def get_available_slots(self, obj):
        try:
            return obj.slots.filter(is_available=True).count()
        except:
            return 0    

    def get_lot_image_url(self, obj):
        """Return absolute URL for lot image"""
        if obj.lot_image:
            request = self.context.get('request')
            image_url = obj.lot_image.url
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    def get_avg_rating(self, obj):
        """Calculate average rating for the lot"""
        qs = Review.objects.filter(lot=obj)
        if not qs.exists():
            return None
        avg = qs.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None

    read_only_fields = ["lot_id", "available_slots", "lot_image_url", "avg_rating"]


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
        fields = ["lot_id", "lot_name", "latitude", "longitude", "provides_carwash"]

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
    has_carwash = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    is_cancellable = serializers.SerializerMethodField()

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
            "vehicle_type",
            "booking_type",
            "booking_time",
            "start_time",
            "end_time",
            "price",
            "status",
            "is_expired",
            "remaining_time",
            "carwash",
            "has_carwash",
            "payment",
            "payments",
            "total_amount",
            "is_cancellable",
        ]

    read_only_fields = ["booking_id", "price", "booking_time", "lot", "vehicle_type", "start_time", "end_time", "is_expired", "remaining_time", "carwash", "has_carwash", "payment", "payments", "total_amount", "is_cancellable"]

    def validate_vehicle_number(self, value):
        """Validate vehicle number format and check for duplicate active bookings"""
        if value:
            # Vehicle number format validation is handled by the model's validator
            normalized_value = value.strip().upper()
            
            # Get the current user from context
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                # Check if user already has an active booking with this vehicle number
                # Only check if this is a CREATE operation (not UPDATE)
                if not self.instance:  # instance is None during creation
                    existing_booking = Booking.objects.filter(
                        user__auth_user=request.user,
                        vehicle_number=normalized_value,
                        status__in=['booked', 'BOOKED', 'active', 'ACTIVE', 'scheduled', 'SCHEDULED']
                    ).exists()
                    
                    if existing_booking:
                        raise serializers.ValidationError(
                            f"You already have an active booking for vehicle {normalized_value}. "
                            "Please use a different vehicle number or wait for the current booking to complete."
                        )
            
            return normalized_value
        return value

    def get_lot_detail(self, obj):
        """Get lot details from the slot"""
        if obj.slot and obj.slot.lot:
            serializer = PLotNestedSerializer(obj.slot.lot)
            return serializer.data
        return None

    def get_payment(self, obj):
        """Get first payment details if exists (for backward compatibility)"""
        try:
            payments = obj.payments.all()
            if payments.exists():
                return PaymentSerializer(payments.first()).data
            return None
        except:
            return None

    def get_payments(self, obj):
        """Get all payment details for this booking"""
        try:
            payments = obj.payments.all()
            if payments.exists():
                return PaymentSerializer(payments, many=True).data
            return []
        except:
            return []

    def get_total_amount(self, obj):
        """Calculate total amount (slot price + carwash price if exists)"""
        total = float(obj.price) if obj.price else 0.0
        
        # Add carwash price if exists (should only be one active/pending carwash)
        active_carwashes = obj.booking_by_user.filter(status__in=['active', 'pending'])
        if active_carwashes.exists():
            # Only add the first carwash price (there should only be one)
            carwash = active_carwashes.first()
            if carwash and carwash.price:
                total += float(carwash.price)
            
            # Log warning if multiple exist
            if active_carwashes.count() > 1:
                print(f"⚠️ Total calculation: Booking {obj.booking_id} has {active_carwashes.count()} active carwashes, only counting first one")
        
        return round(total, 2)


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
        """Get carwash service for this booking (active, pending, or completed)"""
        # Include completed carwashes so they show in booking confirmation after completion
        carwashes = obj.booking_by_user.filter(status__in=['active', 'pending', 'completed'])
        
        if carwashes.exists():
            # Return the first one (should be only one carwash per booking)
            if carwashes.count() > 1:
                print(f"⚠️ WARNING: Booking {obj.booking_id} has {carwashes.count()} carwash services!")
                for cw in carwashes:
                    print(f"   - Carwash {cw.carwash_id}: {cw.carwash_type.name} (Status: {cw.status})")
            
            return CarwashNestedSerializer(carwashes.first()).data
        return None
    
    def get_has_carwash(self, obj):
        """
        Boolean field to easily check if booking has an active/pending carwash.
        Used by frontend to disable "Book Carwash" button.
        """
        has_carwash = obj.booking_by_user.filter(status__in=['active', 'pending']).exists()
        # DEBUG: Log the has_carwash check
        print(f"🔍 get_has_carwash for Booking {obj.booking_id}: {has_carwash} (Count: {obj.booking_by_user.filter(status__in=['active', 'pending']).count()})")
        return has_carwash
    
    def get_is_cancellable(self, obj):
        """
        Check if booking can be cancelled (not already cancelled or completed).
        """
        non_cancellable_statuses = ['CANCELLED', 'COMPLETED', 'cancelled', 'completed']
        return obj.status not in non_cancellable_statuses

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
    status = serializers.ChoiceField(choices=Payment.PAYMENT_STATUS_CHOICES)
    payment_type = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "pay_id",
            "booking_read",
            "booking",
            "user",
            "payment_method",
            "amount",
            "status",
            "transaction_id",
            "created_at",
            "payment_type",
            "is_renewal",
        ]
        read_only_fields = ["pay_id", "user", "created_at", "payment_type"]

    def get_payment_type(self, obj):
        """
        Determine payment type by checking if it's the slot payment or a carwash payment.
        Slot payment is the FIRST successful payment.
        Carwash payments are any subsequent payments.
        """
        booking = obj.booking
        
        # Get all payments for this booking ordered by creation date
        all_payments = booking.payments.all().order_by('created_at')
        
        if not all_payments.exists():
            return "Unknown"
        
        # Get the index of current payment
        payment_list = list(all_payments)
        
        try:
            index = payment_list.index(obj)
            
            # First payment is the slot payment (regardless of status)
            if index == 0:
                return "Slot Payment"
            
            # For subsequent payments, they are carwash payments
            # Check if there's actually a Carwash object for this booking
            has_carwash = Carwash.objects.filter(booking=booking).exists()
            
            if has_carwash:
                return "Car Wash Payment"
            else:
                # Payment exists but no corresponding carwash (orphaned payment - employee unavailable)
                return "Car Wash Payment"  # Still label it as carwash payment, just no service created
                
        except ValueError:
            print(f"⚠️ get_payment_type: Payment {obj.pay_id} not found in booking payments list")
            return "Unknown"
        except Exception as e:
            print(f"⚠️ get_payment_type error: {e}")
            return "Unknown"



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
    owner = serializers.PrimaryKeyRelatedField(
        queryset=OwnerProfile.objects.all(),
        required=False,
        allow_null=True
    )
    
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
            "availability_status",
            "current_assignments",
        ]

        read_only_fields = ["employee_id", "current_assignments"]
    
    def get_owner_detail(self, obj):
        if obj.owner:
            return {
                'id': obj.owner.id,
                'firstname': obj.owner.firstname,
                'lastname': obj.owner.lastname,
                'phone': obj.owner.phone
            }
        return None

class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for admin employee monitoring.
    Includes computed status and owner details.
    """
    name = serializers.SerializerMethodField()
    assigned_owner = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'employee_id',
            'name',
            'phone',
            'driving_license',
            'location',
            'assigned_owner',
            'status',
            'availability_status',
            'current_assignments',
        ]
        read_only_fields = fields
    
    def get_name(self, obj):
        """Return full name"""
        return f"{obj.firstname} {obj.lastname}"
    
    def get_assigned_owner(self, obj):
        """Return owner name if assigned"""
        if obj.owner:
            return f"{obj.owner.firstname} {obj.owner.lastname}"
        return None
    
    def get_location(self, obj):
        """Return formatted location or 'Not set'"""
        if obj.latitude and obj.longitude:
            return f"{obj.latitude}, {obj.longitude}"
        return "Not set"
    
    def get_status(self, obj):
        """Return 'Assigned' or 'Unassigned' based on owner"""
        return "Assigned" if obj.owner else "Unassigned"

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
            "status",
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
    
    def validate_booking(self, value):
        """
        Validate that no active or pending carwash already exists for this booking.
        This prevents multiple add-on carwash services for the same parking slot.
        """
        print(f"\n🔍 CarwashSerializer.validate_booking() called for Booking {value.booking_id}")
        
        # Check if a carwash already exists for this booking with active/pending status
        existing_carwash = Carwash.objects.filter(
            booking=value,
            status__in=['active', 'pending']
        ).exists()
        
        existing_count = Carwash.objects.filter(
            booking=value,
            status__in=['active', 'pending']
        ).count()
        
        print(f"   Existing active/pending carwash: {existing_carwash} (Count: {existing_count})")
        
        if existing_carwash:
            print(f"   ❌ VALIDATION FAILED: Carwash already exists for this booking")
            raise serializers.ValidationError(
                "A car wash service is already booked for this parking slot. "
                "Please complete or cancel the existing service before booking another."
            )
        
        print(f"   ✅ VALIDATION PASSED: No existing carwash found\n")
        return value

    def create(self, validated_data):
        """
        Create a new carwash with price auto-set from carwash_type.
        Includes duplicate check as additional safeguard.
        """
        print(f"\n🔧 CarwashSerializer.create() called")
        
        # Double-check for existing carwash (defense in depth)
        booking = validated_data.get('booking')
        existing = Carwash.objects.filter(
            booking=booking,
            status__in=['active', 'pending']
        ).exists()
        
        print(f"   Booking: {booking.booking_id}")
        print(f"   Double-check - Existing carwash: {existing}")
        
        if existing:
            print(f"   ❌ CREATE FAILED: Duplicate detected in create() method\n")
            raise serializers.ValidationError({
                'booking': 'A car wash service is already active for this booking.'
            })
        
        carwash_type = validated_data["carwash_type"]
        validated_data["price"] = carwash_type.price
        
        print(f"   ✅ Creating carwash for Booking {booking.booking_id}\n")
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
        fields = ["firstname", "lastname"]


class ReviewPLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = P_Lot
        fields = ["lot_id", "lot_name", "latitude", "longitude"]


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserProfile.objects.all(), required=False)
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
            "lot",
            "rating",
            "review_desc",
            "review_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["rev_id", "user_detail", "lot_detail", "created_at", "updated_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate_review_desc(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Review description cannot be empty")
        return value.strip()

    def validate_lot(self, value):
        if not value:
            raise serializers.ValidationError("Lot is required")
        return value


# Car Wash Serializers

class CarWashServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for CarWashService master data.
    Used to display available wash types and prices to users.
    """
    class Meta:
        model = CarWashService
        fields = [
            'carwash_service_id',
            'service_name',
            'service_type',
            'description',
            'base_price',
            'estimated_duration',
            'is_active',
            'icon',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['carwash_service_id', 'created_at', 'updated_at']


class CarWashBookingSerializer(serializers.ModelSerializer):
    """
    Serializer for CarWashBooking model.
    Handles creation, update, and retrieval of car wash bookings.
    Includes nested user, lot, and employee details for read operations.
    """
    user_detail = serializers.SerializerMethodField()
    lot_detail = serializers.SerializerMethodField()
    employee_detail = serializers.SerializerMethodField()
    service_type_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = CarWashBooking
        fields = [
            'carwash_booking_id',
            'user',
            'user_detail',
            'lot',
            'lot_detail',
            'employee',
            'employee_detail',
            'service_type',
            'service_type_detail',
            'price',
            'payment_method',
            'payment_status',
            'status',
            'booking_time',
            'scheduled_time',
            'completed_time',
            'notes',
            'transaction_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'carwash_booking_id',
            'user_detail',
            'lot_detail',
            'employee_detail',
            'service_type_detail',
            'booking_time',
            'created_at',
            'updated_at',
        ]
    
    def validate_scheduled_time(self, value):
        """
        Validate that scheduled time is within 7-day booking window.
        Bookings are only allowed from today up to 7 days in the future.
        """
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Convert scheduled_time to date for comparison
        scheduled_date = value.date() if isinstance(value, datetime) else value
        
        # Get today's date
        today = timezone.now().date()
        
        # Calculate max allowed date (today + 7 days)
        max_date = today + timedelta(days=7)
        
        # Validate booking is not in the past
        if scheduled_date < today:
            raise serializers.ValidationError(
                "Cannot book car wash services for past dates. Please select today or a future date."
            )
        
        # Validate booking is within 7-day window
        if scheduled_date > max_date:
            raise serializers.ValidationError(
                f"Bookings are only allowed within 7 days from today. "
                f"Please select a date between {today.strftime('%Y-%m-%d')} and {max_date.strftime('%Y-%m-%d')}."
            )
        
        return value
    
    def get_user_detail(self, obj):
        """Return nested user details"""
        return {
            'user_id': obj.user.id,
            'firstname': obj.user.firstname,
            'lastname': obj.user.lastname,
            'phone': obj.user.phone,
        }
    
    def get_employee_detail(self, obj):
        """Return nested employee details"""
        if obj.employee:
            return {
                'employee_id': obj.employee.employee_id,
                'firstname': obj.employee.firstname,
                'lastname': obj.employee.lastname,
                'phone': obj.employee.phone,
                'availability_status': obj.employee.availability_status,
                'current_assignments': obj.employee.current_assignments,
            }
        return None
    
    def get_lot_detail(self, obj):
        """Return nested lot details"""
        if obj.lot:
            # Build full address
            address_parts = []
            if obj.lot.streetname:
                address_parts.append(obj.lot.streetname)
            if obj.lot.locality:
                address_parts.append(obj.lot.locality)
            if obj.lot.city:
                address_parts.append(obj.lot.city)
            if obj.lot.state:
                address_parts.append(obj.lot.state)
            if obj.lot.pincode:
                address_parts.append(obj.lot.pincode)
            
            full_address = ", ".join(address_parts) if address_parts else "N/A"
            
            return {
                'lot_id': obj.lot.lot_id,
                'lot_name': obj.lot.lot_name,
                'streetname': obj.lot.streetname or '',
                'locality': obj.lot.locality or '',
                'city': obj.lot.city,
                'state': obj.lot.state,
                'pincode': obj.lot.pincode or '',
                'address': full_address,  # Complete formatted address
                'provides_carwash': obj.lot.provides_carwash,
            }
        return None
    
    def get_service_type_detail(self, obj):
        """Return service type details with name and price"""
        return {
            'name': obj.service_type,
            'price': float(obj.price) if obj.price else 0.00,
        }


class CarWashPaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model when linked to car wash bookings.
    Includes car wash specific details.
    """
    carwash_booking_detail = CarWashBookingSerializer(source='carwash_booking', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'pay_id',
            'carwash_booking',
            'carwash_booking_detail',
            'user',
            'payment_method',
            'amount',
            'status',
            'service_type',
            'transaction_id',
            'created_at',
            'verified_by',
            'verified_at',
        ]
        read_only_fields = [
            'pay_id',
            'carwash_booking_detail',
            'created_at',
            'verified_at',
        ]