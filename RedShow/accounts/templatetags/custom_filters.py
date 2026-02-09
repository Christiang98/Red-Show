from django import template

register = template.Library()

@register.filter
def dict_get(d, key):
    """Obtiene el valor de un diccionario con la clave 'key', devuelve {} si no existe."""
    if d is None:
        return {}
    return d.get(key, {})
