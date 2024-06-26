from django.db import models


# Create your models here.


class PDFDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='pdfs/')

    def __str__(self):
        return f"{self.title} - {self.file.name}"


class UserEntry(models.Model):
    pdf = models.ForeignKey(PDFDocument, on_delete=models.CASCADE)
    user_text = models.TextField()
    spell_checked_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()
    pdf_file = models.FileField(upload_to='user_entries_pdfs/', null=True, blank=True)
