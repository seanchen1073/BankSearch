# Generated by Django 5.1 on 2024-09-10 08:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bank', '0003_alter_bank_options_alter_branch_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bank',
            name='name',
            field=models.CharField(default='Default Bank Name', max_length=100),
        ),
    ]