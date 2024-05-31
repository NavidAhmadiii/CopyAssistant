from django.contrib import admin
from .models import PDFDocument, UserEntry

# Register your models here.

admin.site.register(PDFDocument)
admin.site.register(UserEntry)
