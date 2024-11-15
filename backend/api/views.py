from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from .api import optimize_prompt
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
    return Response({"data": "Hello World"})

@api_view(['POST'])
@permission_classes([AllowAny])
def optimize_prompt(request):
    prompt = request.data.get("prompt")
    optimized_prompt = optimize_prompt(prompt)
    return Response({"optimized_prompt": optimized_prompt})
