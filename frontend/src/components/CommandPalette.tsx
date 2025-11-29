import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { LayoutDashboard, Users, UserPlus, Upload, BarChart3 } from "lucide-react";
import { mockGroups_API, mockMembers_API, Group, Member } from "@/lib/mockData";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      const [g, m] = await Promise.all([mockGroups_API.getAll(), mockMembers_API.getAll()]);
      setGroups(g);
      setMembers(m);
    };
    load();
  }, []);

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
  const filteredMembers = members
    .filter((m) => m.fullName.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={search} onValueChange={setSearch} placeholder="Search groups, members, or navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => { navigate("/dashboard"); onOpenChange(false); }}>
            <LayoutDashboard className="mr-2" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/groups"); onOpenChange(false); }}>
            <Users className="mr-2" />
            Groups
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/members"); onOpenChange(false); }}>
            <UserPlus className="mr-2" />
            Members
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/upload"); onOpenChange(false); }}>
            <Upload className="mr-2" />
            Excel Upload
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/reports"); onOpenChange(false); }}>
            <BarChart3 className="mr-2" />
            Reports
          </CommandItem>
        </CommandGroup>
        {search && (
          <CommandGroup heading="Groups">
            {filteredGroups.map((g) => (
              <CommandItem key={g.id} onSelect={() => { navigate("/groups"); onOpenChange(false); }}>
                <Users className="mr-2" />
                {g.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {search && (
          <CommandGroup heading="Members">
            {filteredMembers.map((m) => (
              <CommandItem key={m.id} onSelect={() => { navigate("/members"); onOpenChange(false); }}>
                <UserPlus className="mr-2" />
                {m.fullName}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}