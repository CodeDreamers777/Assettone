# Generated by Django 5.1.3 on 2024-12-05 06:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_profile_alter_property_manager_alter_property_owner_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='unit',
            name='custom_unit_type',
            field=models.CharField(blank=True, help_text='Required if unit type is CUSTOM', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='unit',
            name='payment_period',
            field=models.CharField(choices=[('MONTHLY', 'Monthly'), ('BIMONTHLY', 'Bi-Monthly'), ('HALF_YEARLY', 'Half Yearly'), ('YEARLY', 'Yearly')], default='MONTHLY', help_text='Rent payment period', max_length=20),
        ),
        migrations.AddField(
            model_name='unit',
            name='rent',
            field=models.DecimalField(decimal_places=2, default=1, help_text='Required monthly rent amount', max_digits=10),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='unit',
            name='unit_type',
            field=models.CharField(choices=[('STUDIO', 'Studio Apartments'), ('ONE_BEDROOM', 'One-Bedroom Apartments'), ('TWO_BEDROOM', 'Two-Bedroom Apartments'), ('THREE_BEDROOM', 'Three-Bedroom Apartments'), ('PENTHOUSE', 'Penthouses'), ('BEDSITTER', 'Bedsitters'), ('DUPLEX', 'Duplex Apartments'), ('MAISONETTE', 'Maisonettes'), ('CUSTOM', 'Custom')], default='STUDIO', max_length=50),
        ),
    ]
