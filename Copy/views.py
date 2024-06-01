import textwrap
import time
import io
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
            # داده‌ها از درخواست دریافت شوند
            data = json.loads(request.body)
            text = data.get('text')
            timer = data.get('timer')

            # Spell check the user text
            spell = SpellChecker()
            words = text.split()
            corrected_text = []

            for word in words:
                if word in spell.unknown([word]):
                    corrected_word = spell.correction(word)
                    corrected_text.append(f"{word} ({corrected_word})")
                else:
                    corrected_text.append(word)

            # Create a string with the corrected text
            corrected_text_str = ' '.join(corrected_text)

            # Calculate statistics
            word_count = len(words)
            slash_count = text.count('/')
            average_count = word_count / slash_count if slash_count > 0 else 0

            # Generate PDF content
            pdf_buffer = io.BytesIO()
            self.create_pdf(pdf_buffer, corrected_text_str, word_count, slash_count, average_count, timer)
            pdf_buffer.seek(0)

            # Create PDFDocument object
            pdf_document = PDFDocument.objects.create(
                title="Spell Checked Document",
                file=pdf_buffer
            )

            # Create the UserEntry object
            entry = UserEntry.objects.create(
                pdf=pdf_document,
                user_text=text,
                spell_checked_text=corrected_text_str,
                duration=timer
            )

            # Create the HTTP response
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="spell_checked.pdf"'

            return response

        except Exception as e:
            print(f"Error creating PDF: {e}")
            return JsonResponse({'error': str(e)}, status=500)

    def create_pdf(self, buffer, text, word_count, slash_count, average_count, timer):
        try:
            c = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter

            # Display statistics above the PDF content
            c.drawString(100, height - 50, f"Timer: {timer}")
            c.drawString(100, height - 70, f"Words: {word_count}")
            c.drawString(100, height - 90, f"Slashes: {slash_count}")
            c.drawString(100, height - 110, f"Average: {average_count:.2f}")

            # Original text section
            c.drawString(100, height - 150, "Corrected Text:")
            y = height - 170

            # Display the corrected text
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
