import time
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
            file = request.FILES.get('pdf_file')
            if file:
                file_path = default_storage.save('pdfs/' + file.name, ContentFile(file.read()))
            else:
                return JsonResponse({'error': 'No file uploaded'}, status=400)

            pdf = PDFDocument.objects.create(title='عنوان مورد نظر', file=file_path)
            pdf_id = pdf.id

            data = json.loads(request.POST['data'])
            text = data.get('text')
            timer = data.get('timer')

            entry = UserEntry.objects.create(pdf_id=pdf_id, user_text=text, spell_checked_text='', duration=timer)

            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="spell_checked.pdf"'
            self.create_pdf(response, entry)
            return response

        except Exception as e:
            print(f"Error creating PDF: {e}")
            return JsonResponse({'error': str(e)}, status=500)

    def create_pdf(self, response, entry):
        try:
            c = canvas.Canvas(response, pagesize=letter)
            width, height = letter

            y = height - 100
            c.drawString(100, y, "Original Text:")
            y -= 20

            # Spell check the user text
            spell = SpellChecker()
            words = entry.user_text.split()
            corrected_text = []

            for word in words:
                if word in spell.unknown([word]):
                    corrected_word = spell.correction(word)
                    corrected_text.append(f"<span class='corrected'>{word}</span> ({corrected_word})")
                else:
                    corrected_text.append(word)

            # Display the corrected text
            c.drawString(100, y, ' '.join(corrected_text))
            y -= 40

            c.drawString(100, y, f"Duration: {entry.duration}")
            c.showPage()
            c.save()
        except Exception as e:
            print(f"Error during PDF creation: {e}")


class LoadPDFsFromDB(View):
    def get(self, request):
        pdfs = PDFDocument.objects.all()
        pdf_list = [{'id': pdf.id, 'title': pdf.title, 'url': pdf.file.url} for pdf in pdfs]
        return JsonResponse(pdf_list, safe=False)
