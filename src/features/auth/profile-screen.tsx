"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { Eye, Fish, Gift, MoreHorizontal, Trash2, Trophy, UserCheck, UserPlus, UserX, Users, X } from "lucide-react";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { FishRevealModal } from "@/components/fish/fish-reveal-modal";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import {
  useAddFriend,
  useClaimFriendGift,
  useFriendRequestAction,
  useFriends,
  useRemoveFriend,
  useSendFriendGift
} from "@/features/friends/use-friends";
import { useSellFish } from "@/features/inventory/use-fish-actions";
import type { AcquiredFish, FriendView, PendingGiftView } from "@/types/game";

const giftOptions = [
  { type: "FISH_CASE", label: "Кейс с рыбкой", cost: 100 },
  { type: "ALGAE_25", label: "25 водорослей", cost: 25 },
  { type: "ALGAE_50", label: "50 водорослей", cost: 50 },
  { type: "ALGAE_75", label: "75 водорослей", cost: 75 },
  { type: "ALGAE_100", label: "100 водорослей", cost: 100 }
];

const giftLabel: Record<string, string> = {
  FISH_CASE: "кейс с рыбкой",
  ALGAE_25: "25 водорослей",
  ALGAE_50: "50 водорослей",
  ALGAE_75: "75 водорослей",
  ALGAE_100: "100 водорослей"
};

function formatDate(value: string | null) {
  if (!value) return "пока не было";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatFriendDuration(value: string) {
  const createdAt = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - createdAt);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} д. ${hours} ч.`;
  return `${hours} ч.`;
}

export function ProfileScreen() {
  const player = usePlayer();
  const friends = useFriends();
  const addFriend = useAddFriend();
  const requestAction = useFriendRequestAction();
  const removeFriend = useRemoveFriend();
  const sendGift = useSendFriendGift();
  const claimGift = useClaimFriendGift();
  const sellFish = useSellFish();
  const [telegramId, setTelegramId] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedGiftFriendId, setSelectedGiftFriendId] = useState<string | null>(null);
  const [revealedFish, setRevealedFish] = useState<AcquiredFish | null>(null);
  const selectedFriend = useMemo(
    () => friends.data?.friends.find((friend) => friend.id === selectedFriendId) ?? null,
    [friends.data?.friends, selectedFriendId]
  );
  const selectedGiftFriend = useMemo(
    () => friends.data?.friends.find((friend) => friend.id === selectedGiftFriendId) ?? null,
    [friends.data?.friends, selectedGiftFriendId]
  );

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
        {requestAction.error ? <p className="text-sm text-yellow-100">{requestAction.error.message}</p> : null}

        {friends.data?.requests.length ? (
          <div className="space-y-2">
            {friends.data.requests.map((request) => (
              <div key={request.id} className="rounded-xl bg-cyan-300/10 p-3">
                <div className="truncate font-bold">{request.firstName ?? request.username ?? `ID ${request.telegramId}`}</div>
                <div className="text-xs text-cyan-100/55">
                  {request.direction === "incoming" ? "Хочет добавить тебя в друзья" : "Заявка отправлена"}
                </div>
                {request.direction === "incoming" ? (
                  <div className="mt-3 flex gap-2">
                    <Button className="h-9 flex-1 bg-emerald-300" disabled={requestAction.isPending} onClick={() => requestAction.mutate({ requestId: request.id, action: "accept" })}>
                      <UserCheck className="h-4 w-4" /> Принять
                    </Button>
                    <Button className="h-9 flex-1 bg-rose-300" disabled={requestAction.isPending} onClick={() => requestAction.mutate({ requestId: request.id, action: "decline" })}>
                      <UserX className="h-4 w-4" /> Отклонить
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {friends.data?.friends.length ? (
            friends.data.friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/30 p-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{friend.firstName ?? friend.username ?? `ID ${friend.telegramId}`}</div>
                  <div className="text-xs text-cyan-100/55">
                    ID {friend.telegramId} · {friend.fishCount} рыб · уровень {friend.level}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {friend.pendingGift ? (
                    <Button className="h-10 w-10 px-0 bg-amber-300" onClick={() => setSelectedGiftFriendId(friend.id)} aria-label="Открыть подарок">
                      <Gift className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button className="h-10 w-10 px-0" onClick={() => setSelectedFriendId(friend.id)} aria-label="Открыть меню друга">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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

      {selectedFriend ? (
        <FriendModal
          friend={selectedFriend}
          isBusy={removeFriend.isPending || sendGift.isPending}
          error={removeFriend.error?.message ?? sendGift.error?.message}
          onClose={() => setSelectedFriendId(null)}
          onRemove={() =>
            removeFriend.mutate(selectedFriend.id, {
              onSuccess: () => setSelectedFriendId(null)
            })
          }
          onGift={(type) => sendGift.mutate({ friendId: selectedFriend.id, type })}
        />
      ) : null}

      {selectedGiftFriend?.pendingGift ? (
        <GiftModal
          gift={selectedGiftFriend.pendingGift}
          isBusy={claimGift.isPending}
          error={claimGift.error?.message}
          onClose={() => setSelectedGiftFriendId(null)}
          onClaim={() =>
            claimGift.mutate(selectedGiftFriend.pendingGift!.id, {
              onSuccess: ({ acquiredFish }) => {
                setSelectedGiftFriendId(null);
                setRevealedFish(acquiredFish);
              }
            })
          }
        />
      ) : null}

      {revealedFish ? (
        <FishRevealModal
          fish={revealedFish}
          isBusy={sellFish.isPending}
          error={sellFish.error?.message}
          onClose={() => setRevealedFish(null)}
          onSell={() =>
            sellFish.mutate(revealedFish.id, {
              onSuccess: () => setRevealedFish(null)
            })
          }
        />
      ) : null}
    </div>
  );
}

function FriendModal({
  friend,
  isBusy,
  error,
  onClose,
  onRemove,
  onGift
}: {
  friend: FriendView;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onRemove: () => void;
  onGift: (type: string) => void;
}) {
  const [showAquarium, setShowAquarium] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/70 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)]">
      <div className="glass w-full max-w-md space-y-4 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-2xl font-black text-cyan-50">{friend.firstName ?? friend.username ?? `ID ${friend.telegramId}`}</div>
            <div className="text-sm text-cyan-100/60">ID {friend.telegramId}</div>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/40 text-cyan-100" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showAquarium ? (
          <div className="space-y-3">
            <div className="h-64 overflow-hidden rounded-xl border border-cyan-100/15">
              <AquariumRenderer fish={friend.fish} className="min-h-0 rounded-none" />
            </div>
            <Button className="w-full" onClick={() => setShowAquarium(false)}>
              Закрыть просмотр
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <FriendInfo label="Рыбки" value={friend.fishCount.toString()} />
              <FriendInfo label="Уровень" value={friend.level.toString()} />
              <FriendInfo label="Дружите" value={formatFriendDuration(friend.friendsSince)} />
              <FriendInfo label="Последний подарок" value={formatDate(friend.lastGiftAt)} />
            </div>

            <Button className="w-full bg-sky-300" onClick={() => setShowAquarium(true)}>
              <Eye className="h-4 w-4" /> Аквариум друга
            </Button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-100">
                <Gift className="h-4 w-4" /> Подарки
              </div>
              {giftOptions.map((gift) => (
                <Button key={gift.type} className="h-10 w-full justify-between bg-cyan-300/90" disabled={isBusy} onClick={() => onGift(gift.type)}>
                  <span>{gift.label}</span>
                  <span>{gift.cost}</span>
                </Button>
              ))}
            </div>

            {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

            <Button className="w-full bg-rose-300" disabled={isBusy} onClick={onRemove}>
              <Trash2 className="h-4 w-4" /> Удалить друга
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function GiftModal({
  gift,
  isBusy,
  error,
  onClose,
  onClaim
}: {
  gift: PendingGiftView;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onClaim: () => void;
}) {
  const senderName = gift.sender.firstName ?? gift.sender.username ?? `ID ${gift.sender.telegramId}`;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/72 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)]">
      <div className="glass w-full max-w-md space-y-4 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-2xl font-black text-cyan-50">Подарок</div>
            <div className="text-sm text-cyan-100/60">
              {senderName} · ID {gift.sender.telegramId}
            </div>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/40 text-cyan-100" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-amber-300/14 p-4 text-center">
          <Gift className="mx-auto h-12 w-12 text-amber-200" />
          <div className="mt-3 text-lg font-black text-cyan-50">{giftLabel[gift.type]}</div>
          <div className="mt-1 text-sm text-cyan-100/65">Подарен {formatDate(gift.createdAt)}</div>
        </div>

        {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

        <Button className="w-full bg-emerald-300" disabled={isBusy} onClick={onClaim}>
          Забрать подарок
        </Button>
      </div>
    </div>
  );
}

function FriendInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="text-xs text-cyan-100/55">{label}</div>
      <div className="mt-1 truncate font-bold">{value}</div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
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
