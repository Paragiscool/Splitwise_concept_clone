from database import SessionLocal
import models

def seed_db():
    db = SessionLocal()
    users_to_seed = [
        models.User(name="Parag", email="parag@example.com"),
        models.User(name="Kamlesh", email="kamlesh@example.com"),
        models.User(name="Rahul", email="rahul@example.com")
    ]
    
    existing = db.query(models.User).count()
    if existing == 0:
        db.add_all(users_to_seed)
        db.commit()
        print("Successfully seeded Parag, Kamlesh, and Rahul.")
    else:
        print(f"Database already contains {existing} users. Skipping seed.")
        
    db.close()

if __name__ == "__main__":
    seed_db()
