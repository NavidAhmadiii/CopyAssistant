import time
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.views import View
from .models import PDFDocument, UserEntry


class IndexView(View):
    def get(self, request):
        pdfs = PDFDocument.objects.all()
        context = {
            'pdfs': pdfs
        }
        return render(request, 'index.html', context=context)


class ReadPDFView(View):
    def get(self, request, pdf_id):
        pdf = get_object_or_404(PDFDocument, id=pdf_id)
        context = {
            'pdf': pdf
        }
        return render(request, 'index.html', context=context)

    def post(self, request, pdf_id):
        pdf = get_object_or_404(PDFDocument, id=pdf_id)
        user_text = request.POST.get('user_text')
        start_time = float(request.POST.get('start_time'))
        end_time = time.time()
        duration = timezone.timedelta(seconds=end_time - start_time)

        spell_checked_text = self.spell_check(user_text)

        entry = UserEntry.objects.create(
            pdf=pdf,
            user_text=user_text,
            spell_checked_text=spell_checked_text,
            duration=duration
        )
        return JsonResponse({'spell_checked_text': spell_checked_text, 'entry_id': entry.id})

    def spell_check(self, text):
        pass
