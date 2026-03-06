from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Event, Booking, Message, Review


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'bio', 'phone', 'location', 'profile_picture', 'rating', 'reviews_count', 'created_at']
        read_only_fields = ['id', 'rating', 'reviews_count', 'created_at']


class EventSerializer(serializers.ModelSerializer):
    owner = ProfileSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = ['id', 'owner', 'title', 'description', 'category', 'event_date', 'location', 'capacity', 'price', 'image', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class BookingSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    requester = ProfileSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'event', 'requester', 'booking_date', 'event_date', 'status', 'message', 'total_price', 'updated_at']
        read_only_fields = ['id', 'booking_date', 'updated_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = ProfileSerializer(read_only=True)
    reviewed_user = ProfileSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'reviewed_user', 'booking', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'reviewer', 'created_at']
