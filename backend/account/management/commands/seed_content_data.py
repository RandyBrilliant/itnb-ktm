from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from account.models import CustomUser, UserRole
from main.models import Benefit, BenefitCategory, Certificate, CertificateStatus, Event, Post, PostCategory


class Command(BaseCommand):
    help = "Seed certificates, perks (benefits), news posts, and events for local/dev."

    @transaction.atomic
    def handle(self, *args, **options):
        now = timezone.now()

        student = self._get_or_create_user("student@itnb.local", "ITNB Student", UserRole.STUDENT)
        lecturer = self._get_or_create_user("lecturer@itnb.local", "ITNB Lecturer", UserRole.LECTURER)
        staff = self._get_or_create_user("staff@itnb.local", "ITNB Staff", UserRole.STAFF)

        categories = self._seed_benefit_categories()
        self._seed_benefits(categories)
        self._seed_posts_and_events(staff, lecturer, now)
        self._seed_certificates(student, lecturer, staff, now)

        self.stdout.write(self.style.SUCCESS("Content seed complete (certificates, perks, news, events)."))

    def _get_or_create_user(self, email: str, full_name: str, role: str) -> CustomUser:
        user, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role,
                "is_active": True,
                "email_verified": True,
            },
        )
        return user

    def _seed_benefit_categories(self):
        data = [
            ("Academic", "Benefits related to academics and certifications.", "school"),
            ("Lifestyle", "Food, health, and day-to-day partner perks.", "favorite"),
            ("Technology", "Software and digital service access.", "devices"),
        ]
        result = {}
        for name, description, icon in data:
            item, _ = BenefitCategory.objects.get_or_create(
                name=name,
                defaults={"description": description, "icon": icon},
            )
            result[name] = item
        return result

    def _seed_benefits(self, categories):
        fixtures = [
            {
                "title": "Student Microsoft 365 Access",
                "description": "Access Office 365 apps and 1TB cloud storage for academic use.",
                "description_short": "Office apps + cloud storage for students.",
                "image_url": "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
                "partner": "IT&B Digital Services",
                "category": categories["Technology"],
                "eligible_roles": "STUDENT,LECTURER",
                "is_active": True,
            },
            {
                "title": "Campus Cafe Discount",
                "description": "Get special meal pricing by showing your digital student ID.",
                "description_short": "Exclusive student food discount at campus cafe.",
                "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
                "partner": "IT&B Cafe",
                "category": categories["Lifestyle"],
                "eligible_roles": "STUDENT",
                "is_active": True,
            },
            {
                "title": "Certification Exam Voucher",
                "description": "Voucher support for selected professional certification exams.",
                "description_short": "Professional exam support for active students.",
                "image_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
                "partner": "Academic Affairs Office",
                "category": categories["Academic"],
                "eligible_roles": "STUDENT,ALUMNI",
                "is_active": True,
            },
        ]

        for payload in fixtures:
            benefit, _ = Benefit.objects.get_or_create(title=payload["title"], defaults=payload)
            for key, value in payload.items():
                setattr(benefit, key, value)
            benefit.save()

    def _seed_posts_and_events(self, staff: CustomUser, lecturer: CustomUser, now):
        post_fixtures = [
            {
                "title": "Midterm Schedule Released",
                "body": "The official midterm schedule has been published. Please review your faculty portal for detailed timings.",
                "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
                "author": staff,
                "category": PostCategory.ACADEMIC,
                "is_published": True,
                "published_at": now - timedelta(days=2),
            },
            {
                "title": "Campus Career Talk 2026",
                "body": "Join our annual career talk with industry partners and alumni speakers. Registration is now open.",
                "image_url": "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
                "author": lecturer,
                "category": PostCategory.EVENT,
                "is_published": True,
                "published_at": now - timedelta(days=1),
            },
            {
                "title": "Library Operating Hours Update",
                "body": "Library hours are extended during exam weeks to support student learning.",
                "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
                "author": staff,
                "category": PostCategory.ANNOUNCEMENT,
                "is_published": True,
                "published_at": now - timedelta(hours=6),
            },
        ]

        for payload in post_fixtures:
            post, _ = Post.objects.get_or_create(
                title=payload["title"],
                defaults=payload,
            )
            for key, value in payload.items():
                setattr(post, key, value)
            post.save()
            if post.category == PostCategory.EVENT:
                Event.objects.get_or_create(
                    post=post,
                    defaults={
                        "event_date": now + timedelta(days=7),
                        "event_location": "Main Auditorium",
                        "capacity": 250,
                    },
                )

    def _seed_certificates(self, student: CustomUser, lecturer: CustomUser, issuer: CustomUser, now):
        cert_fixtures = [
            {
                "user": student,
                "title": "Data Analytics Workshop Completion",
                "description": "Completed 24-hour workshop on practical data analytics.",
                "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
                "issued_date": (now - timedelta(days=120)).date(),
                "valid_until": None,
                "status": CertificateStatus.ISSUED,
            },
            {
                "user": student,
                "title": "Digital Marketing Fundamentals",
                "description": "Successfully completed Digital Marketing Fundamentals program.",
                "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
                "issued_date": (now - timedelta(days=240)).date(),
                "valid_until": (now + timedelta(days=365)).date(),
                "status": CertificateStatus.ISSUED,
            },
            {
                "user": issuer,
                "title": "Academic Administration Excellence",
                "description": "Recognition for outstanding contribution to academic administration.",
                "image_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
                "issued_date": (now - timedelta(days=180)).date(),
                "valid_until": None,
                "status": CertificateStatus.ISSUED,
            },
            {
                "user": lecturer,
                "title": "Advanced Teaching & Learning Certificate",
                "description": "Awarded for completing advanced pedagogy and digital classroom training.",
                "image_url": "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80",
                "issued_date": (now - timedelta(days=90)).date(),
                "valid_until": None,
                "status": CertificateStatus.ISSUED,
            },
        ]

        for payload in cert_fixtures:
            cert, _ = Certificate.objects.get_or_create(
                user=payload["user"],
                title=payload["title"],
                defaults={
                    **payload,
                    "issued_by": issuer,
                },
            )
            cert.description = payload["description"]
            cert.image_url = payload["image_url"]
            cert.issued_date = payload["issued_date"]
            cert.valid_until = payload["valid_until"]
            cert.status = payload["status"]
            cert.issued_by = issuer
            cert.save()

