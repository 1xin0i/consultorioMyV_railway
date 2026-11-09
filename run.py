import subprocess
import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

projects = {
    "Backend": os.path.join(ROOT_DIR, "backend"),
    "Frontend": os.path.join(ROOT_DIR, "frontend")
}

processes = []

def install_dependencies(name, directory):
    node_modules = os.path.join(directory, "node_modules")

    if not os.path.exists(node_modules):
        print(f"\n[{name}] Instalando dependencias...")
        subprocess.run(
            ["npm.cmd", "install"],
            cwd=directory,
            check=True
        )
    else:
        print(f"[{name}] Dependencias ya instaladas.")

try:
    # Instalar dependencias si es necesario
    for name, directory in projects.items():
        install_dependencies(name, directory)

    # Iniciar servidores
    for name, directory in projects.items():
        print(f"\nIniciando {name}...")
        process = subprocess.Popen(
            ["npm.cmd", "run", "dev"],
            cwd=directory
        )
        processes.append(process)

    print("\nBackend y Frontend iniciados.")
    print("Presioná Ctrl+C para detenerlos.")

    while True:
        # Detectar si alguno de los servidores terminó
        for process in processes:
            if process.poll() is not None:
                raise RuntimeError("Uno de los servidores se detuvo.")

        import time
        time.sleep(1)

except KeyboardInterrupt:
    print("\nDeteniendo servidores...")

except subprocess.CalledProcessError as e:
    print(f"\nError instalando dependencias: {e}")

except RuntimeError as e:
    print(f"\n{e}")

finally:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    print("Procesos finalizados.")