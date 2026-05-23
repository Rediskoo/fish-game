"use client";

import { FormEvent, useState } from "react";
import { Fish, Trophy, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useAddFriend, useFriends } from "@/features/friends/use-friends";

export function ProfileScreen() {
  const player = usePlayer();
  const friends = useFriends();
  const addFriend = useAddFriend();
  const [telegramId, setTelegramId] = useState("");

  function handleAddFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addFriend.mutate(telegramId, {
      onSuccess: () => setTelegramId("")
    });
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Profile</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">{player.data?.user.firstName ?? "Игрок"}</h1>
      </header>
      <Panel className="grid grid-cols-2 gap-3">
        <Stat icon={<Fish className="h-5 w-5" />} label="Рыбки" value={player.data?.fish.length ?? 0} />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Уровень" value={player.data?.aquarium.level ?? 1} />
      </Panel>
      <Panel>
        <div className="text-sm text-cyan-100/60">Telegram User ID</div>
        <div className="font-mono text-lg">{player.data?.user.telegramId ?? "Загрузка..."}</div>
      </Panel>
      <Panel className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-100/70" />
          <div className="font-bold">Друзья</div>
        </div>
        <form className="flex gap-2" onSubmit={handleAddFriend}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35 focus:border-cyan-200/45"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Telegram User ID"
            value={telegramId}
            onChange={(event) => setTelegramId(event.target.value)}
          />
          <Button disabled={addFriend.isPending || telegramId.trim().length < 5} type="submit">
            <UserPlus className="h-4 w-4" />
          </Button>
        </form>
        {addFriend.error ? <p className="text-sm text-yellow-100">{addFriend.error.message}</p> : null}
        <div className="space-y-2">
          {friends.data?.friends.length ? (
            friends.data.friends.map((friend) => (
              <div key={friend.id} className="rounded-xl bg-slate-950/30 p-3">
                <div className="truncate font-bold">
                  {friend.firstName ?? friend.username ?? `ID ${friend.telegramId}`}
                </div>
                <div className="text-xs text-cyan-100/55">
                  ID {friend.telegramId} · {friend.fishCount} рыб · уровень {friend.level}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-slate-950/25 p-3 text-sm text-cyan-100/55">
              Добавь друга по Telegram User ID.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="flex items-center gap-2 text-cyan-100/65">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
