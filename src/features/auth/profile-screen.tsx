"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Check, Eye, Fish, Gift, MoreHorizontal, Pencil, Send, Star, Trash2, Trophy, UserCheck, UserPlus, UserX, Users, X } from "lucide-react";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { FishRevealModal } from "@/components/fish/fish-reveal-modal";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { aquariumAssets } from "@/assets/aquarium-assets";
import { usePlayer } from "@/features/auth/use-player";
import {
  useAddFriend,
  useClaimFriendGift,
  useFriendRequestAction,
  useFriends,
  useRemoveFriend,
  useSendFriendGift,
  useVisitFriendAquarium
} from "@/features/friends/use-friends";
import { useSellFish } from "@/features/inventory/use-fish-actions";
import { fishVisualAsset } from "@/lib/app-assets";
import type { AcquiredFish, FishView, FriendView, PendingGiftView } from "@/types/game";
import { useProfilePreferencesStore } from "@/stores/profile-preferences-store";
import { useUpdateProfile } from "@/features/auth/use-update-profile";
import { useSharedAquariums } from "@/features/friends/use-shared-aquariums";
import { SharedAquariumModal } from "@/features/friends/shared-aquarium-modal";

const giftOptions = [
  { type: "FISH_CASE", label: "Кейс с рыбкой", cost: 100 },
  { type: "ALGAE_25", label: "25 водорослей", cost: 25 },
  { type: "ALGAE_50", label: "50 водорослей", cost: 50 },
  { type: "ALGAE_75", label: "75 водорослей", cost: 75 },
  { type: "ALGAE_100", label: "100 водорослей", cost: 100 }
];

const giftLabel: Record<string, string> = {
  FISH_CASE: "кейс с рыбкой",
  OWNED_FISH: "своя рыбка",
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

function formatGameSince(value?: string) {
  if (!value) return "загрузка";
  return `${new Date(value).toLocaleDateString("ru-RU")} · ${formatFriendDuration(value)}`;
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
  const visitAquarium = useVisitFriendAquarium();
  const [telegramId, setTelegramId] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedGiftFriendId, setSelectedGiftFriendId] = useState<string | null>(null);
  const [revealedFish, setRevealedFish] = useState<AcquiredFish | null>(null);
  const profilePreferences = useProfilePreferencesStore();
  const updateProfile = useUpdateProfile();
  const sharedAquariums = useSharedAquariums();
  const [editingProfile, setEditingProfile] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profilePreferences.nickname);
  const [bioDraft, setBioDraft] = useState("");
  const [sharedFriendId, setSharedFriendId] = useState<string | null>(null);
  const selectedFriend = useMemo(
    () => friends.data?.friends.find((friend) => friend.id === selectedFriendId) ?? null,
    [friends.data?.friends, selectedFriendId]
  );
  const selectedSharedAquarium = useMemo(
    () => sharedAquariums.data?.find((aquarium) => aquarium.friendId === sharedFriendId) ?? null,
    [sharedAquariums.data, sharedFriendId]
  );
  const selectedGiftFriend = useMemo(
    () => friends.data?.friends.find((friend) => friend.id === selectedGiftFriendId) ?? null,
    [friends.data?.friends, selectedGiftFriendId]
  );
  const favoriteFish = (player.data?.fish ?? []).filter((fish) => fish.isFavorite).slice(0, 4);
  const friendsCount = friends.data?.friends.length ?? 0;
  const avatarOptions = useMemo(() => Array.from(new Set([aquariumAssets.profile.avatarDiver, ...(player.data?.fish ?? []).slice(0, 8).map(fishVisualAsset), aquariumAssets.achievements.firstFish, aquariumAssets.achievements.masterAquarist])), [player.data?.fish]);
  const currentAvatar = profilePreferences.avatar ?? player.data?.user.profileAvatar ?? aquariumAssets.profile.avatarDiver;
  const publicName = player.data?.user.profileName ?? profilePreferences.nickname;

  function handleAddFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addFriend.mutate(telegramId, {
      onSuccess: () => setTelegramId("")
    });
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Профиль</h1>
      </header>

      <Panel className="relative overflow-hidden rounded-[18px] border-cyan-100/18 bg-[linear-gradient(145deg,rgba(9,50,68,.82),rgba(4,20,34,.9))]">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,rgba(251,191,36,.18),rgba(8,36,52,.88))] text-cyan-50 shadow-[0_0_30px_rgba(251,191,36,.22)]">
            <img className="h-16 w-16 rounded-full object-contain" src={currentAvatar} alt="" />
            <img className="pointer-events-none absolute inset-0 h-full w-full object-contain" src={aquariumAssets.profile.avatarFrame} alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><div className="truncate text-xl font-black text-cyan-50">{publicName}</div><button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300/12 text-cyan-100" onClick={() => { setNicknameDraft(publicName); setBioDraft(player.data?.user.profileBio ?? ""); setEditingProfile((value) => !value); }} aria-label="Изменить профиль"><Pencil className="h-4 w-4" /></button></div>
            {player.data?.user.profileBio ? <div className="mt-1 line-clamp-2 text-xs text-cyan-100/72">{player.data.user.profileBio}</div> : null}
            <div className="mt-1 text-sm text-cyan-100/66">В игре с {formatGameSince(player.data?.user.createdAt)}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-200/55 bg-slate-950/45 text-sm font-black text-amber-100">{player.data?.aquarium.level ?? 1}</span>
              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-slate-950/60">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#facc15,#38bdf8)]" style={{ width: "58%" }} />
                </div>
                <div className="mt-1 truncate text-[10px] text-cyan-100/48">Telegram ID {player.data?.user.telegramId ?? "загрузка"}</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {editingProfile ? <Panel className="space-y-3 border-cyan-200/24"><div className="font-black">Изменить профиль</div><label className="block text-xs text-cyan-100/60">Ник<input className="mt-1 h-11 w-full rounded-xl border border-cyan-100/16 bg-slate-950/40 px-3 text-base font-bold text-cyan-50" value={nicknameDraft} maxLength={18} onChange={(event) => setNicknameDraft(event.target.value)} /></label><label className="block text-xs text-cyan-100/60">Описание<textarea className="mt-1 min-h-20 w-full resize-none rounded-xl border border-cyan-100/16 bg-slate-950/40 p-3 text-sm text-cyan-50" value={bioDraft} maxLength={140} placeholder="Расскажи друзьям о своём аквариуме" onChange={(event) => setBioDraft(event.target.value)} /><span className="float-right mt-1">{bioDraft.length}/140</span></label><div><div className="mb-2 text-xs text-cyan-100/60">Аватарка</div><div className="grid grid-cols-5 gap-2">{avatarOptions.map((avatar) => <button key={avatar} type="button" onClick={() => profilePreferences.setAvatar(avatar)} className={`grid aspect-square place-items-center rounded-2xl border p-1 ${currentAvatar === avatar ? "border-amber-200 bg-amber-300/14" : "border-cyan-100/12 bg-slate-950/30"}`}><img className="h-12 w-12 object-contain" src={avatar} alt="" /></button>)}</div></div><Button className="w-full bg-emerald-300" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate({ profileName: nicknameDraft, profileBio: bioDraft, profileAvatar: profilePreferences.avatar }, { onSuccess: () => { profilePreferences.setNickname(nicknameDraft); setEditingProfile(false); } })}><Check className="h-4 w-4" /> Сохранить профиль</Button>{updateProfile.error ? <p className="text-xs text-rose-200">{updateProfile.error.message}</p> : null}</Panel> : null}

      <Panel className="relative z-0 grid grid-cols-4 gap-2 rounded-[18px] border-cyan-100/18 bg-[linear-gradient(145deg,rgba(8,43,59,.76),rgba(4,18,31,.86))]">
        <Stat icon={<Fish className="h-5 w-5" />} label="Рыбки" value={(player.data?.fish.length ?? 0).toString()} />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Уровень" value={(player.data?.aquarium.level ?? 1).toString()} />
        <Stat icon={<Users className="h-5 w-5" />} label="Друзья" value={friendsCount.toString()} />
        <Stat icon={<Star className="h-5 w-5" />} label="Избранное" value={favoriteFish.length.toString()} />
      </Panel>

      <Panel className="space-y-3 overflow-hidden rounded-[18px] border-cyan-100/16 bg-[linear-gradient(145deg,rgba(8,43,59,.76),rgba(4,18,31,.86))]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-black text-cyan-50">Избранные рыбки и декор</div>
          <div className="rounded-full bg-slate-950/45 px-3 py-1 text-xs font-black text-cyan-100">{favoriteFish.length}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(favoriteFish.length ? favoriteFish : (player.data?.fish ?? []).slice(0, 4)).map((fish) => (
            <div key={fish.id} className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-cyan-100/14 bg-slate-950/32">
              <img className="h-16 w-16 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.42)]" src={fishVisualAsset(fish)} alt="" />
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="space-y-3 border-emerald-200/20 bg-[linear-gradient(145deg,rgba(5,150,105,.18),rgba(8,47,73,.72))]">
        <div className="flex items-center justify-between gap-3">
          <div><div className="font-black text-emerald-100">Общие аквариумы</div><div className="text-xs text-cyan-100/60">Рыбки, которых вы вырастили вместе</div></div>
          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">{sharedAquariums.data?.length ?? 0}</span>
        </div>
        {sharedAquariums.data?.length ? <div className="space-y-2">{sharedAquariums.data.map((aquarium) => <button type="button" key={aquarium.id} onClick={() => setSharedFriendId(aquarium.friendId)} className="flex w-full items-center justify-between rounded-2xl border border-emerald-200/15 bg-slate-950/35 p-3 text-left"><div className="min-w-0"><div className="truncate font-black">С {aquarium.friendName}</div><div className="text-xs text-cyan-100/55">{aquarium.fish.length}/12 рыб · загрязнение {aquarium.pollution}%</div></div><span className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950">Открыть</span></button>)}</div> : <div className="rounded-2xl bg-slate-950/30 p-3 text-sm text-cyan-100/60">Общий аквариум появится здесь сразу после того, как друг примет приглашение в питомнике.</div>}
      </Panel>
      <Panel className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-100/70" />
          <div className="font-bold">Друзья</div>
        </div>

        <form className="flex gap-2" onSubmit={handleAddFriend}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35 focus:border-cyan-200/45"
            placeholder="Telegram ID или @username"
            value={telegramId}
            onChange={(event) => setTelegramId(event.target.value)}
          />
          <Button disabled={addFriend.isPending || telegramId.trim().length < 3} type="submit">
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
                  <div className="truncate font-bold">{friend.profileName ?? friend.firstName ?? friend.username ?? `ID ${friend.telegramId}`}</div>
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
                  {sharedAquariums.data?.some((aquarium) => aquarium.friendId === friend.id) ? <Button className="h-10 bg-emerald-300 px-3" onClick={() => setSharedFriendId(friend.id)} aria-label="Открыть общий аквариум"><span className="text-xs font-black">Общий</span></Button> : null}
                  <Button className="h-10 w-10 px-0" onClick={() => setSelectedFriendId(friend.id)} aria-label="Открыть меню друга">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-slate-950/25 p-3 text-sm text-cyan-100/55">
              Добавь друга по Telegram ID или @username.
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
          ownFish={player.data?.fish ?? []}
          onGiftFish={(fishId) => sendGift.mutate({ friendId: selectedFriend.id, type: "OWNED_FISH", fishId })}
          onVisit={() => visitAquarium.mutate(selectedFriend.id)}
        />
      ) : null}

      {selectedSharedAquarium ? <SharedAquariumModal aquarium={selectedSharedAquarium} onClose={() => setSharedFriendId(null)} /> : null}

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

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-cyan-100/10 bg-slate-950/26 p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/12 text-cyan-200">
        {icon}
      </div>
      <div className="mt-2 truncate text-base font-black text-cyan-50">{value}</div>
      <div className="truncate text-[10px] font-semibold text-cyan-100/58">{label}</div>
    </div>
  );
}

function FriendModal({
  friend,
  isBusy,
  error,
  onClose,
  onRemove,
  onGift,
  ownFish,
  onGiftFish,
  onVisit
}: {
  friend: FriendView;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onRemove: () => void;
  onGift: (type: string) => void;
  ownFish: FishView[];
  onGiftFish: (fishId: string) => void;
  onVisit: () => void;
}) {
  const [showAquarium, setShowAquarium] = useState(false);
  const [giftFishId, setGiftFishId] = useState("");

  return (
    <div data-app-modal="true" className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/70 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)] sm:place-items-center">
      <div className="glass max-h-[calc(100dvh-28px-var(--safe-top)-var(--safe-bottom))] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-2xl font-black text-cyan-50">{friend.profileName ?? friend.firstName ?? friend.username ?? `ID ${friend.telegramId}`}</div>
            <div className="text-sm text-cyan-100/60">ID {friend.telegramId}</div>
            {friend.profileBio ? <div className="mt-2 text-sm text-cyan-100/75">{friend.profileBio}</div> : null}
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/40 text-cyan-100" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showAquarium ? (
          <div className="space-y-3">
            <div className="h-[min(64dvh,520px)] min-h-[420px] overflow-hidden rounded-xl border border-cyan-100/15">
              <AquariumRenderer fish={friend.fish} className="h-full min-h-0 rounded-none" />
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

            <Button className="w-full bg-sky-300" onClick={() => { setShowAquarium(true); onVisit(); }}>
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
              <div className="rounded-xl bg-slate-950/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Fish className="h-4 w-4" /> Подарить свою рыбку
                </div>
                <div className="flex gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none"
                    value={giftFishId}
                    onChange={(event) => setGiftFishId(event.target.value)}
                  >
                    <option value="">Выбрать рыбку</option>
                    {ownFish.map((fish) => (
                      <option key={fish.id} value={fish.id}>
                        {fish.name} · {fish.displayName}
                      </option>
                    ))}
                  </select>
                  <Button className="h-10 bg-emerald-300 px-3" disabled={isBusy || !giftFishId || ownFish.length <= 1} onClick={() => onGiftFish(giftFishId)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
    <div data-app-modal="true" className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/72 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)]">
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
          <div className="mt-3 text-lg font-black text-cyan-50">{gift.fish?.displayName ?? giftLabel[gift.type]}</div>
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
