import type { CrewMember } from "@/types";

interface AvatarProps {
  member: CrewMember;
  small?: boolean;
}

export function Avatar({ member, small = false }: AvatarProps) {
  return (
    <span className={`avatar ${member.color} ${small ? "small" : ""}`}>{member.initials}</span>
  );
}
