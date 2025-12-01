from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from datetime import datetime, timedelta

phone_regex = RegexValidator(
    regex=r'^(?:\+91)?[6-9]\d{9}$', 
    message="Phone number must be 10 digits, optionally starting with +91."
)

pincode_regex = RegexValidator(
    regex=r'^[1-9]\d{5}$', 
    message="Pincode must be a 6-digit number and cannot start with 0."
)

vehicle_regex = RegexValidator(
    regex=r'^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{1,4}$',
    message="Vehicle number must be in a valid format, e.g., KL-08-AZ-1234"
)
    
VEHICLE_CHOICES=[
    ('Hatchback','Hatchback'),
    ('Sedan','Sedan'),
    ('SUV','SUV'),
    ('Three-Wheeler','Three-Wheeler'),
    ('Two-Wheeler','Two-Wheeler')
    ]

BOOKING_CHOICES=[
    ('Instant','Instant'),
    ('Advance','Advance')
    ]

PAYMENT_CHOICES=[
        ('CC','Credit Card'),
        ('Cash','Cash'),
        ('UPI','QR code')
    ]

class AuthUser(AbstractUser):
    ROLE_CHOICES=(
        ('User','User'),
        ('Owner','Owner'),
        ('Admin','Admin'),
    )
    role=models.CharField(max_length=15,choices=ROLE_CHOICES, default='User')

    def __str__(self):
        return self.username
        
class UserProfile(models.Model):

    auth_user=models.OneToOneField(AuthUser,on_delete=models.CASCADE)
    firstname=models.CharField(max_length=100)
    lastname=models.CharField(max_length=100)
    phone=models.CharField(max_length=15,validators=[phone_regex])
    vehicle_number=models.CharField(max_length=100,validators=[vehicle_regex])
    vehicle_type=models.CharField(max_length=50,choices=VEHICLE_CHOICES)
    created_at= models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        db_table='USER'

    def __str__(self):
        return f"{self.firstname} {self.lastname}"
    

    
class OwnerProfile(models.Model):

    STATUS_PENDING='PENDING'
    STATUS_APPROVED='APPROVED'
    STATUS_DECLINED='DECLINED'
    VERIFATION_STATUS_CHOICE=[
        (STATUS_PENDING,'Pending Review'),
        (STATUS_APPROVED,'Approved'),
        (STATUS_DECLINED,'Declined')
         ]
    auth_user=models.OneToOneField(AuthUser,on_delete=models.CASCADE)
    firstname=models.CharField(max_length=100)
    lastname=models.CharField(max_length=100)
    phone=models.CharField(max_length=100)
    streetname=models.CharField(max_length=200,help_text="Building or Streetname")
    locality=models.CharField(max_length=100,help_text="Neighbourhood or Area",blank=True,null=True)
    city=models.CharField(max_length=100)
    state=models.CharField(max_length=100)
    pincode=models.CharField(max_length=6,help_text="6-digit PIN code",validators=[pincode_regex])
    #verification_id=models.CharField(max_length=100,null=True,blank=True)#Land document is the verification id.
    verification_status=models.CharField(max_length=20,choices=VERIFATION_STATUS_CHOICE,default=STATUS_PENDING,help_text="Admin approval status for owner")
    verification_document_image=models.ImageField(upload_to='verification_documents/',null=True,
                                                  blank=True,help_text="Scanned copy of verification document")
    # Saves to MEDIA_ROOT/verification_documents/
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.id}) - {self.verification_status}"
    
    
    class Meta:
        db_table='OWNER'


    
class P_Lot(models.Model):
    lot_id=models.AutoField(primary_key=True)
    owner=models.ForeignKey(to=OwnerProfile,on_delete=models.CASCADE,db_column='owner_id',related_name='lot_owner')
    lot_name=models.CharField(max_length=100)
    streetname=models.CharField(max_length=100,help_text="Enter building or street name")
    locality=models.CharField(max_length=100,help_text="Neighbourhood or Area",null=True,blank=True)
    city=models.CharField(max_length=100)
    state=models.CharField(max_length=100)
    pincode=models.CharField(max_length=6,help_text="6-digit PIN code",validators=[pincode_regex])
    latitude=models.DecimalField(max_digits=9,decimal_places=6,help_text="Latitude for map pin",null=True,blank=True)
    longitude=models.DecimalField(max_digits=9,decimal_places=6,help_text="Longitude for map pin",null=True,blank=True)
    total_slots=models.IntegerField()
    lot_image=models.ImageField(upload_to="lot_images/",null=True,blank=True,help_text="Image for the parking lot card")
    #available_slots=models.BooleanField(default=True,help_text="True if the parking lot has at least one free slot,False if full.")
    
    def available_slots(self):
        # Check if any slots are available (status=True)
        return self.slots.filter(is_available=True).count()
        
        
        
    def __str__(self):
        return self.lot_name
    
    class Meta:
        db_table='PARKING_LOT'
    
class P_Slot(models.Model):
 
    slot_id=models.AutoField(primary_key=True)
    lot=models.ForeignKey(to=P_Lot,on_delete=models.CASCADE,db_column='lot_id',related_name='slots')
    vehicle_type=models.CharField(max_length=100,choices=VEHICLE_CHOICES)  
    price=models.DecimalField(max_digits=5,decimal_places=2,help_text="The hourly rate of specific Slot",default=50.00)
    is_available=models.BooleanField(default=True,help_text="True if the slot is free, false if booked")



    def __str__(self):
        return f"Slot {self.slot_id} - Lot{self.lot.lot_name} - {self.vehicle_type}"

    class Meta:
        db_table='PARKING_SLOT'

class Employee(models.Model):
    employee_id=models.AutoField(primary_key=True)
    firstname=models.CharField(max_length=100)
    lastname=models.CharField(max_length=100)
    phone=models.CharField(max_length=100,validators=[phone_regex])
    latitude=models.DecimalField(max_digits=9,decimal_places=6,help_text="Latitude for employee pin",null=True,blank=True)
    longitude=models.DecimalField(max_digits=9,decimal_places=6,help_text="Latitude for employee pin",null=True,blank=True)
    driving_license=models.CharField(max_length=100,help_text="Driving License Number")
    driving_license_image=models.ImageField(upload_to='employee_licenses',null=True,blank=True,help_text='Image of the Driving License')
    owner=models.ForeignKey(to=OwnerProfile,on_delete=models.CASCADE,db_column='owner_id',related_name='employees')

    def __str__(self):
        return f"{self.firstname} {self.lastname}"

    class Meta:
        db_table='EMPLOYEE'

class Carwash_type(models.Model):
    carwash_type_id=models.AutoField(primary_key=True)
    name=models.CharField(max_length=100)
    description=models.CharField(max_length=100)
    price=models.DecimalField(max_digits=5,decimal_places=2,default=0.00)

    def __str__(self):
        return self.name   

    class Meta:
        db_table='CARWASH_TYPE'



class Booking(models.Model):
    booking_id=models.AutoField(primary_key=True)
    user=models.ForeignKey(to=UserProfile,on_delete=models.CASCADE,db_column='user_id',related_name='bookings')
    slot=models.ForeignKey(to=P_Slot,on_delete=models.CASCADE,db_column='slot_id',related_name='booking_of_slot')
    lot=models.ForeignKey(to=P_Lot,on_delete=models.CASCADE,db_column='lot_id',related_name='booking_in_lot')
    vehicle_number=models.CharField(max_length=100,validators=[vehicle_regex])
    booking_type=models.CharField(max_length=100,choices=BOOKING_CHOICES)
    booking_time=models.DateField(auto_now_add=True)
    start_time=models.DateTimeField(null=True,blank=True,help_text="Booking start time (auto-set when created)")
    end_time=models.DateTimeField(null=True,blank=True,help_text="Booking end time (default 1 hour from start)")
    price=models.DecimalField(max_digits=5,decimal_places=2,default=0.00)

    STATUS_CHOICES=[
        ('booked','Booked'),
        ('completed','Completed'),
        ('cancelled','Cancelled')
    ]
    status=models.CharField(max_length=10,choices=STATUS_CHOICES,default="booked")

    def save(self, *args, **kwargs):
        # Set start_time if not already set
        if not self.start_time:
            from django.utils import timezone
            self.start_time = timezone.now()
        # Set end_time to 1 hour after start_time if not already set
        if not self.end_time and self.start_time:
            self.end_time = self.start_time + timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_expired(self):
        """Check if booking time has expired"""
        if self.end_time:
            from django.utils import timezone
            return timezone.now() > self.end_time and self.status.lower() == 'booked'
        return False

    def __str__(self):
        return f"Booking {self.booking_id} for {self.user.firstname}"    

    class Meta:
        db_table='BOOKING'

class Carwash(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Payment Verification'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    carwash_id=models.AutoField(primary_key=True)
    booking=models.ForeignKey(to=Booking,on_delete=models.CASCADE,db_column='booking_id',related_name='booking_by_user')
    #service_id=models.ForeignKey(to=Services,on_delete=models.CASCADE,db_column='service_id',related_name='carwashes')
    employee=models.ForeignKey(to=Employee,on_delete=models.CASCADE,db_column='emp_id',related_name='carwashes')
    carwash_type=models.ForeignKey(to=Carwash_type,on_delete=models.CASCADE,db_column='carwash_type',related_name='carwashes')
    price=models.DecimalField(max_digits=5,decimal_places=2,default=0.00)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='active')
    
    def __str__(self):
        return f"Carwash {self.carwash_id} for booking {self.booking.booking_id}"
    
    class Meta:
        db_table='CARWASH'

        
class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
    ]

    pay_id=models.AutoField(primary_key=True)
    booking=models.ForeignKey(to=Booking,on_delete=models.CASCADE,related_name='payments')
    user=models.ForeignKey(to=UserProfile,on_delete=models.CASCADE,related_name='payments_made_by_user')
    payment_method=models.CharField(max_length=100,choices=PAYMENT_CHOICES)
    amount=models.DecimalField(max_digits=8,decimal_places=2,default=0.00)
    status=models.CharField(max_length=10,choices=PAYMENT_STATUS_CHOICES,default='SUCCESS')
    transaction_id=models.CharField(max_length=100,blank=True,null=True)
    created_at=models.DateTimeField(auto_now_add=True, null=True)
    verified_by=models.ForeignKey(to=AuthUser,on_delete=models.SET_NULL,null=True,blank=True,related_name='payments_verified')
    verified_at=models.DateTimeField(null=True,blank=True)

    def __str__(self):
        return f"Payment {self.pay_id} for Booking {self.booking.booking_id} - {self.status}"    

    class Meta:
        db_table='PAYEMENT'

class Tasks(models.Model):
    task_id=models.AutoField(primary_key=True)
    booking=models.ForeignKey(to=Booking,on_delete=models.CASCADE,db_column='booking_id',related_name='tasks_assigned')
    employee=models.ForeignKey(to=Employee,on_delete=models.CASCADE,db_column='emp_id',related_name='tasks')
    task_type=models.CharField(max_length=100)

    def __str__(self):
        return f"Task {self.task_id}: {self.task_type}"


    class Meta:
        db_table='TASKS'

class Review(models.Model):
    rev_id=models.AutoField(primary_key=True)
    lot=models.ForeignKey(to=P_Lot,on_delete=models.CASCADE,db_column='lot_id',related_name='review_of_lot')
    user=models.ForeignKey(to=UserProfile,on_delete=models.CASCADE,db_column='user_id',related_name='user')
    rating=models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    review_desc=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review {self.rating} by {self.user.firstname} for {self.lot.lot_name}"    

    class Meta:
        db_table='REVIEW'
        ordering = ['-created_at']

#class Login(models.Model):
    #login_id=models.AutoField(primary_key=True)
    #email=models.CharField(max_length=100)
    #password=models.CharField(max_length=100)
    #created_at=models.DateTimeField(auto_now_add=True)

    #def __str__(self):
        #return self.email
    
    #def set_password(self, raw_password):
        #self.password=make_password(raw_password)

    #def check_password(self, raw_password):
        #return check_password(raw_password,self.password)    


    #class Meta:
        #db_table='LOGIN'
#class Services(models.Model):
    #service_id=models.AutoField(primary_key=True)
    #lot_id=models.ForeignKey(to=P_Lot,on_delete=models.CASCADE,db_column='lot_id',related_name='services_by_lot')
    #service_name=models.CharField(max_length=100)
    #description=models.CharField(max_length=200)
    #price=models.DecimalField(max_digits=5,decimal_places=2,default=0.00)

    #def __str__(self):
    #    return f"{self.service_name} at {self.lot_id.lot_name}"    

    #class Meta:
    #    db_table='SERVICES'
    