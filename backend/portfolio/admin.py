from django.contrib import admin

# Register your models here.
from .models import Holding, Alert

admin.site.register(Holding)
admin.site.register(Alert)