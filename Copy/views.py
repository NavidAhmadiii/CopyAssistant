import textwrap
import time
import io
from datetime import datetime

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from spellchecker import SpellChecker
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from .models import PDFDocument, UserEntry


class IndexView(View):
    def get(self, request):
        pdfs = PDFDocument.objects.all()
        context = {'pdfs': pdfs}
        return render(request, 'index.html', context=context)


class ReadPDFView(View):
    def get(self, request, pdf_id):
        pdf = get_object_or_404(PDFDocument, id=pdf_id)
        context = {'pdf': pdf}
        return render(request, 'index.html', context=context)

    def post(self, request, pdf_id):
        pdf = get_object_or_404(PDFDocument, id=pdf_id)
        user_text = request.POST.get('user_text')
        start_time = float(request.POST.get('start_time'))
        end_time = time.time()
        duration = timezone.timedelta(seconds=end_time - start_time)

        # Spell check the text
        spell_checked_text = self.spell_check(user_text)

        # Create a user entry in the database
        entry = UserEntry.objects.create(
            pdf=pdf,
            user_text=user_text,
            spell_checked_text=spell_checked_text,
            duration=duration
        )

        # Prepare data to send to the frontend
        context = {
            'spell_checked_text': spell_checked_text,
            'entry_id': entry.id
        }
        return JsonResponse(context)

    def spell_check(self, text):
        spell = SpellChecker()
        words = text.split()
        corrected_words = [spell.correction(word) if word in spell.unknown([word]) else word for word in words]
        spell_checked_text = ' '.join(corrected_words)
        return spell_checked_text


class SpellCheckView(View):
    def post(self, request):
        data = json.loads(request.body)
        text = data.get('text')

        # Spell check the text
        spell = SpellChecker()
        words = text.split()
        corrected_text = [spell.correction(word) if word in spell.unknown([word]) else word for word in words]
        spell_checked_text = ' '.join(corrected_text)

        # Send the spell-checked text to the frontend
        return JsonResponse({'spell_checked_text': spell_checked_text})


class CreatePDFView(View):
    def post(self, request):
        try:
            # دریافت داده‌ها از درخواست
            data = json.loads(request.body)
            text = data.get('text')
            timer = data.get('timer')

            # بررسی املای متن
            spell = SpellChecker()
            words = text.split()
            corrected_text = []

            for word in words:
                if word in spell.unknown([word]):
                    corrected_word = spell.correction(word)
                    corrected_text.append(f"{word} ({corrected_word})")
                else:
                    corrected_text.append(word)

            # ساخت رشته متن اصلاح شده
            corrected_text_str = ' '.join(corrected_text)

            # محاسبه آمار
            word_count = len(words)
            slash_count = text.count('/')
            average_count = word_count / slash_count if slash_count > 0 else 0

            # دریافت تاریخ و زمان فعلی
            now = datetime.now()
            formatted_timestamp = now.strftime("%Y/%m/%d %H:%M:%S")
            filename_timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")

            # ایجاد محتوای PDF
            pdf_buffer = io.BytesIO()
            self.create_pdf(pdf_buffer, corrected_text_str, word_count, slash_count, average_count, timer,
                            formatted_timestamp)
            pdf_buffer.seek(0)

            # تنظیم پاسخ HTTP برای دانلود فایل PDF
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename_timestamp}.pdf"'

            return response

        except Exception as e:
            print(f"Error creating PDF: {e}")
            return JsonResponse({'error': str(e)}, status=500)

    def create_pdf(self, buffer, text, word_count, slash_count, average_count, timer, timestamp):
        try:
            c = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter

            # نمایش آمار در بالای محتوای PDF
            c.drawString(100, height - 50, f"Timer: {timer}")
            c.drawString(100, height - 70, f"Words: {word_count}")
            c.drawString(100, height - 90, f"Slashes: {slash_count}")
            c.drawString(100, height - 110, f"Average: {average_count:.2f}")
            c.drawString(100, height - 130, f"Date: {timestamp}")

            # بخش متن اصلی
            c.drawString(100, height - 170, "Corrected Text:")
            y = height - 190

            # نمایش متن اصلاح شده
            for line in textwrap.wrap(text, width=70):
                c.drawString(120, y, line)
                y -= 20

            c.showPage()
            c.save()
        except Exception as e:
            print(f"Error during PDF creation: {e}")


class LoadPDFsFromDB(View):
    def get(self, request):
        pdfs = PDFDocument.objects.all()
        pdf_list = [{'id': pdf.id, 'title': pdf.title, 'url': pdf.file.url} for pdf in pdfs]
        return JsonResponse(pdf_list, safe=False)
