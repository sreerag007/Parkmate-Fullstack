import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Payment
from decimal import Decimal

payments = Payment.objects.all()

print(f'Total Payments: {payments.count()}')
print(f'SUCCESS Payments: {payments.filter(status="SUCCESS").count()}')
print(f'PENDING Payments: {payments.filter(status="PENDING").count()}')
print(f'FAILED Payments: {payments.filter(status="FAILED").count()}')

print('\nSample Payments:')
for p in payments[:10]:
    print(f'  ID: {p.pay_id}, Amount: {p.amount}, Status: {p.status}, Method: {p.payment_method}, User: {p.user.firstname if p.user else "N/A"}')

print('\nRevenue Calculation:')
successful_payments = payments.filter(status='SUCCESS')
total_amount = sum(float(p.amount) for p in successful_payments)
platform_revenue = total_amount * 0.30

print(f'Total Amount (SUCCESS): Rs.{total_amount:.2f}')
print(f'Platform Revenue (30%): Rs.{platform_revenue:.2f}')
