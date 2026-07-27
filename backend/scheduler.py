import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

_scheduler = None


def init_scheduler(app):
    """
    Initializes a single APScheduler BackgroundScheduler tied to this Flask
    app, running the premium reminder job once daily.

    Flask's debug reloader (`debug=True`) actually starts the Python process
    TWICE -- once as a monitor process, once as the real worker -- which
    would otherwise create two independent schedulers, each firing the job
    on its own schedule and doubling every reminder. WERKZEUG_RUN_MAIN is
    an environment variable Flask's reloader sets only in the real worker
    process (not the monitor), so checking it here ensures the scheduler is
    only ever created once, even when running with debug=True.
    """
    global _scheduler

    if _scheduler is not None:
        return _scheduler

    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        # This is the reloader's monitor process -- skip starting the
        # scheduler here; the real worker process will start it instead.
        return None

    scheduler = BackgroundScheduler(timezone="UTC")

    def _job():
        # The job runs on a background thread, outside of any HTTP
        # request -- it needs an explicit Flask application context to
        # use current_app.config, db.session, etc.
        with app.app_context():
            from services.reminder_service import run_premium_reminder_job
            run_premium_reminder_job()

    scheduler.add_job(
        _job,
        trigger="interval",
        days=1,
        id="premium_reminder_daily_job",
        replace_existing=True
    )

    scheduler.start()
    _scheduler = scheduler
    logger.info("Premium reminder scheduler started (runs daily).")
    return scheduler
