from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Profile, Event, Booking, Message, Review
from .serializers import (
    UserSerializer, ProfileSerializer, EventSerializer,
    BookingSerializer, MessageSerializer, ReviewSerializer
)


class AuthViewSet(viewsets.ViewSet):
    """Viewset para autenticación"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'artist')
        
        if User.objects.filter(username=email).exists():
            return Response({'error': 'Email ya registrado'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        Profile.objects.create(
            user=user,
            role=role,
            location=request.data.get('location', ''),
            phone=request.data.get('phone', '')
        )
        
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(username=email, password=password)
        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token, _ = Token.objects.get_or_create(user=user)
        profile = Profile.objects.get(user=user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'profile': ProfileSerializer(profile).data
        })


class ProfileViewSet(viewsets.ModelViewSet):
    """Viewset para perfiles"""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        return Response(ProfileSerializer(profile).data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        role = request.query_params.get('role')
        if role:
            profiles = Profile.objects.filter(role=role)
            return Response(ProfileSerializer(profiles, many=True).data)
        return Response({'error': 'role parameter required'}, status=status.HTTP_400_BAD_REQUEST)


class EventViewSet(viewsets.ModelViewSet):
    """Viewset para eventos"""
    queryset = Event.objects.filter(status='published')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        profile = self.request.user.profile
        serializer.save(owner=profile)
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        profile = request.user.profile
        events = Event.objects.filter(owner=profile)
        return Response(EventSerializer(events, many=True).data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        category = request.query_params.get('category')
        location = request.query_params.get('location')
        
        events = Event.objects.filter(status='published')
        if category:
            events = events.filter(category__icontains=category)
        if location:
            events = events.filter(location__icontains=location)
        
        return Response(EventSerializer(events, many=True).data)


class BookingViewSet(viewsets.ModelViewSet):
    """Viewset para reservas"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        profile = self.request.user.profile
        serializer.save(requester=profile)
    
    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        profile = request.user.profile
        bookings = Booking.objects.filter(requester=profile)
        return Response(BookingSerializer(bookings, many=True).data)
    
    @action(detail=False, methods=['get'])
    def received_bookings(self, request):
        profile = request.user.profile
        bookings = Booking.objects.filter(event__owner=profile)
        return Response(BookingSerializer(bookings, many=True).data)
    
    @action(detail=pk, methods=['post'])
    def accept(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'accepted'
        booking.save()
        return Response(BookingSerializer(booking).data)
    
    @action(detail=pk, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'rejected'
        booking.save()
        return Response(BookingSerializer(booking).data)


class MessageViewSet(viewsets.ModelViewSet):
    """Viewset para mensajes"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        messages = Message.objects.filter(sender=user) | Message.objects.filter(recipient=user)
        return Response(MessageSerializer(messages, many=True).data)


class ReviewViewSet(viewsets.ModelViewSet):
    """Viewset para reseñas"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        profile = self.request.user.profile
        serializer.save(reviewer=profile)
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        user_id = request.query_params.get('user_id')
        if user_id:
            reviews = Review.objects.filter(reviewed_user_id=user_id)
            return Response(ReviewSerializer(reviews, many=True).data)
        return Response({'error': 'user_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
