from django.db import models

class Bank(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Branch(models.Model):
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='branches')
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.bank.name} - {self.name}"