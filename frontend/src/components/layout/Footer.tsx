import { Icon } from "@/components/ui";
import { MISSION } from "@/config/mission";

export function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Icon name="planet" size={16} />
        órbita<span>Diseñado para cuidar de quienes exploran.</span>
      </div>
      <span>Prototipo · Datos simulados · No es un dispositivo médico</span>
      <span className="footer-version">{MISSION.code} / v.1.0</span>
    </footer>
  );
}
