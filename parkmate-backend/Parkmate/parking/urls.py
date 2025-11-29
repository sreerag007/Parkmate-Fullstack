from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import(
    AuthViewSet,UserProfileViewSet,OwnerProfileViewSet,P_LotVIewSet,P_SlotViewSet,BookingViewSet,
    PaymentViewSet,TasksViewSet,CarwashViewSet,CarwashTypeViewSet,
    EmployeeViewSet,ReviewViewSet,VerifyCashPaymentView, ###
)

router=DefaultRouter()
router.register(r'user-profiles',UserProfileViewSet, basename='userprofile')
router.register(r'owner-profiles',OwnerProfileViewSet,basename='ownerprofile')
router.register(r'lots',P_LotVIewSet,basename='plot')
router.register(r'slots',P_SlotViewSet,basename='pslot')
router.register(r'bookings',BookingViewSet,basename='booking')
router.register(r'payments',PaymentViewSet,basename='payment')
router.register(r'tasks',TasksViewSet,basename='task')
router.register(r'carwashes',CarwashViewSet,basename='carwash')
router.register(r'carwashtypes',CarwashTypeViewSet,basename='carwashtype')
router.register(r'employees',EmployeeViewSet,basename='employee')
router.register(r'reviews',ReviewViewSet,basename='review')
#router.register(r'auth',AuthViewSet, basename='auth')
auth_register_user=AuthViewSet.as_view({'post':'register_user'})
auth_register_owner=AuthViewSet.as_view({'post':'register_owner'})
auth_login=AuthViewSet.as_view({'post':'login'})
auth_logout=AuthViewSet.as_view({'post':'logout'})
auth_verify=AuthViewSet.as_view({'get':'verify'})

urlpatterns = [
    path("",include(router.urls)),

    path('auth/register-user/', auth_register_user, name='auth-register-user'),
    path('auth/register-owner/', auth_register_owner, name='auth-register-owner'),
    path('auth/login/',auth_login, name='auth-login'),
    path('auth/logout/', auth_logout, name='auth-logout'),
    path('auth/verify/', auth_verify, name='auth-verify'),
    
    path('owner/payments/<str:payment_id>/verify/', VerifyCashPaymentView.as_view(), name='verify-cash-payment'),
]
