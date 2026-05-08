from app.db import SessionLocal
from app.services.importers import import_fwc_ramps


def main() -> None:
    db = SessionLocal()
    try:
        result = import_fwc_ramps(db, use_fixture=False)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
