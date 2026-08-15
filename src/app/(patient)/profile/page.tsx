"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { me, updateMe } from "@/lib/api/auth";
import type { Gender, Profile, ProfileUpdateInput } from "@/lib/api/contracts";

const genderLabels: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
  UNKNOWN: "Chưa cập nhật",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Chưa kích hoạt",
  SUSPENDED: "Đã tạm khóa",
};

function displayValue(value: string | null): string {
  return value?.trim() || "Chưa cập nhật";
}

function formatDate(value: string | null): string {
  if (!value) return "Chưa cập nhật";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase() || "BN";
}

function formFromProfile(profile: Profile): ProfileUpdateInput {
  return {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender,
    address: profile.address ?? "",
  };
}

const inputClassName =
  "w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-body text-ink-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileUpdateInput | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await me();
      setProfile(result);
      setForm(formFromProfile(result));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải hồ sơ cá nhân.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    void me()
      .then((result) => {
        if (!ignore) {
          setProfile(result);
          setForm(formFromProfile(result));
        }
      })
      .catch((cause) => {
        if (!ignore) {
          setError(cause instanceof Error ? cause.message : "Không thể tải hồ sơ cá nhân.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !form.fullName.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateMe(form);
      setProfile(updated);
      setForm(formFromProfile(updated));
      setIsEditing(false);
      setSuccessMessage("Thông tin hồ sơ đã được cập nhật.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật hồ sơ cá nhân.");
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEditing() {
    setForm(formFromProfile(profile!));
    setError(null);
    setIsEditing(false);
  }

  if (isLoading && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10" aria-live="polite">
        <p className="text-body text-ink-700">Đang tải hồ sơ cá nhân...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div role="alert" className="rounded-card border border-danger/20 bg-danger-soft p-5 text-danger">
          <p>{error}</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => void loadProfile()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const info = [
    { label: "Họ và tên", value: profile.fullName },
    { label: "Ngày sinh", value: formatDate(profile.dateOfBirth) },
    { label: "Giới tính", value: genderLabels[profile.gender] ?? profile.gender },
    { label: "Số điện thoại", value: displayValue(profile.phoneNumber) },
    { label: "Địa chỉ", value: displayValue(profile.address) },
    { label: "Trạng thái tài khoản", value: statusLabels[profile.status] ?? profile.status },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {error && (
        <p role="alert" className="mb-6 rounded-xl bg-danger-soft px-4 py-3 text-body text-danger">
          {error}
        </p>
      )}
      {successMessage && (
        <p role="status" className="mb-6 rounded-xl bg-primary-200/50 px-4 py-3 text-body text-primary-900">
          {successMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {profile.avatarUrl ? (
          <span
            role="img"
            aria-label={`Ảnh đại diện của ${profile.fullName}`}
            className="h-16 w-16 shrink-0 rounded-full bg-cover bg-center bg-primary-200"
            style={{ backgroundImage: `url(${JSON.stringify(profile.avatarUrl)})` }}
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-200 font-bold text-primary-900">
            {initials(profile.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-h1 font-bold text-ink-900">{profile.fullName}</h1>
            {profile.isVerified && (
              <Badge tone="success">
                <CheckCircle2 aria-hidden="true" size={14} /> Đã xác minh
              </Badge>
            )}
          </div>
          <p className="break-all text-body text-ink-700">Mã hồ sơ: {profile.id}</p>
        </div>
        {!isEditing && (
          <Button
            className="ml-auto"
            size="sm"
            variant="outline"
            icon={<Pencil aria-hidden="true" size={15} />}
            onClick={() => {
              setSuccessMessage(null);
              setIsEditing(true);
            }}
          >
            Chỉnh sửa
          </Button>
        )}
      </div>

      {isEditing && form ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-card border border-line bg-surface p-6">
          <div>
            <label htmlFor="full-name" className="mb-1.5 block font-medium text-ink-900">Họ và tên</label>
            <input
              id="full-name"
              required
              maxLength={255}
              autoComplete="name"
              className={inputClassName}
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="date-of-birth" className="mb-1.5 block font-medium text-ink-900">Ngày sinh</label>
              <input
                id="date-of-birth"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={inputClassName}
                value={form.dateOfBirth}
                onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="gender" className="mb-1.5 block font-medium text-ink-900">Giới tính</label>
              <select
                id="gender"
                className={inputClassName}
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
              >
                <option value="UNKNOWN">Chưa cập nhật</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="phone-number" className="mb-1.5 block font-medium text-ink-900">Số điện thoại</label>
            <input
              id="phone-number"
              type="tel"
              maxLength={20}
              autoComplete="tel"
              className={inputClassName}
              value={form.phoneNumber}
              onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-1.5 block font-medium text-ink-900">Địa chỉ</label>
            <textarea
              id="address"
              rows={3}
              maxLength={1000}
              autoComplete="street-address"
              className={inputClassName}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
            <Button type="button" variant="ghost" disabled={isSaving} onClick={cancelEditing}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
          {info.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-body text-ink-500">{row.label}</span>
              <span className="text-left font-medium text-ink-900 sm:text-right">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-caption text-ink-500">
        Dữ liệu được đồng bộ từ hồ sơ tài khoản của bạn.
      </p>
    </div>
  );
}
