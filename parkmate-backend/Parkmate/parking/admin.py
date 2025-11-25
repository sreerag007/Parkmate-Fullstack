from django.contrib import admin
from .models import (AuthUser, UserProfile, OwnerProfile, P_Lot, P_Slot, Booking,
                    Payment, Employee, Carwash_type, Carwash, Tasks, 
                    Review,)

admin.site.register(AuthUser)
admin.site.register(UserProfile)
admin.site.register(OwnerProfile)
admin.site.register(P_Lot)
admin.site.register(P_Slot)
admin.site.register(Booking)
admin.site.register(Payment)
admin.site.register(Carwash_type)
admin.site.register(Carwash)
admin.site.register(Tasks)
admin.site.register(Employee)
admin.site.register(Review)
