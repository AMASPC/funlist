import logging
import os
import signal
import sys
import time
import socket
import subprocess
import psutil
import importlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def is_port_in_use(port):
    """Check if a port is in use using socket."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('0.0.0.0', port)) == 0

def find_process_on_port(port):
    """Find process using a specific port using psutil."""
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                for conn in proc.connections(kind='inet'):
                    if conn.laddr.port == port:
                        return proc.pid
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                continue
    except Exception as e:
        logger.error(f"Error finding process on port {port}: {e}")
    return None

def terminate_process(pid):
    """Terminate a process by PID."""
    if not pid:
        return False

    try:
        process = psutil.Process(pid)
        logger.info(f"Terminating process {pid} ({process.name()})")
        process.terminate()

        # Wait for termination
        gone, alive = psutil.wait_procs([process], timeout=3)
        if process in alive:
            logger.info(f"Process {pid} did not terminate, sending SIGKILL")
            process.kill()

        return True
    except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
        logger.error(f"Error terminating process {pid}: {e}")
        return False

def free_port(port):
    """Free a port by terminating the process using it."""
    if not is_port_in_use(port):
        logger.info(f"Port {port} is already free")
        return True

    pid = find_process_on_port(port)
    if pid:
        logger.info(f"Found process {pid} using port {port}")
        return terminate_process(pid)
    else:
        # Try lsof as a backup
        try:
            cmd = f"lsof -i :{port} -t"
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode().strip()
            if output:
                for pid_str in output.split('\n'):
                    try:
                        terminate_process(int(pid_str))
                    except ValueError:
                        continue
                return not is_port_in_use(port)
        except subprocess.SubprocessError:
            pass

    # Last resort: pkill
    try:
        subprocess.run(['pkill', '-f', f':{port}'], check=False)
        time.sleep(1)
        return not is_port_in_use(port)
    except Exception as e:
        logger.error(f"Error using pkill: {e}")

    return False

def run_flask_app():
    """Run the Flask application."""
    try:
        # Use PORT=80 for deployment or default to 8080 for local development
        default_port = int(os.environ.get('PORT', 80))
        print(f"Ensuring port {default_port} is available...")
        
        # Force kill any process using port 8080
        if is_port_in_use(default_port):
            free_port(default_port)
            print(f"Port {default_port} has been freed")
            # Add a short delay to ensure port is released
            time.sleep(1)
        
        # Clear all console output with an escape sequence
        print("\033c", flush=True)
        print(f"Starting Flask server on port {default_port}")
        print(f"\n🚀 Server running at: http://0.0.0.0:{default_port}")
        if "REPL_SLUG" in os.environ and "REPL_OWNER" in os.environ:
            print(f"🌐 Public URL: https://{os.environ.get('REPL_SLUG')}.{os.environ.get('REPL_OWNER')}.repl.co")
        
        # Always bind to 0.0.0.0 to ensure the server is accessible externally
        # Set debug=True for development, but disable auto-reloader
        app.run(
            host='0.0.0.0',
            port=default_port,
            debug=False,
            use_reloader=False,
            threaded=True
        )
        
    except Exception as e:
        logger.error(f"Error running Flask app: {str(e)}", exc_info=True)
        sys.exit(1)


def update_database_schema():
    try:
        # Import the database update function
        update_schema_module = importlib.import_module('update_schema')
        logger.info("Running database schema update...")
        result = update_schema_module.update_schema()
        if result:
            logger.info("Database schema updated successfully")
        else:
            logger.warning("Database schema update completed with warnings")
        return True
    except Exception as e:
        logger.error(f"Error updating database schema: {str(e)}")
        return False

# Create the Flask app
try:
    from app import create_app
    app = create_app()

    # Update database schema before starting
    update_database_schema()

    # Register signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}, shutting down")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except Exception as e:
    logger.error(f"Error creating Flask app: {str(e)}", exc_info=True)
    sys.exit(1)

# Route definitions are handled in routes.py through init_routes
# Don't define routes here to avoid conflicts



if __name__ == "__main__":
    try:
        run_flask_app()
    except Exception as e:
        logger.error(f"Fatal error in main: {e}", exc_info=True)
        sys.exit(1)