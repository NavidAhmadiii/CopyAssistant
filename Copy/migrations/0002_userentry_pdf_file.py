# Generated by Django 4.2 on 2024-05-29 18:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Copy', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userentry',
            name='pdf_file',
            field=models.FileField(blank=True, null=True, upload_to='user_entries_pdfs/'),
        ),
    ]
