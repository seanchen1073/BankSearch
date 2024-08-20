from django.db import models

class Bank(models.Model):
    name = models.CharField(max_length=20, default='Default Bank Name')
    code = models.CharField(max_length=20, default='000000')
    address = models.CharField(max_length=255, blank=False, null=False, default='Default Address')
    tel = models.CharField(max_length=20, default='0000000000')

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        ordering = ['code']

class Branch(models.Model):
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='branches')
    code = models.CharField(max_length=10, default='0000000000')
    name = models.CharField(max_length=100, default='Default Branch Name')
    address = models.CharField(max_length=255, blank=False, null=False, default='Default Address')
    tel = models.CharField(max_length=20, default='0000000000')

    def __str__(self):
        return f"{self.bank.name} - {self.name} ({self.code})"

    class Meta:
        ordering = ['code']
