# Generated by Django 3.2.25 on 2024-08-23 11:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0003_tournamentparticipant_chanel_name'),
    ]

    operations = [
        migrations.RenameField(
            model_name='tournamentparticipant',
            old_name='chanel_name',
            new_name='channel_name',
        ),
    ]