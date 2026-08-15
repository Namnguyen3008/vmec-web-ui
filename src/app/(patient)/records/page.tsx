import { FolderLock } from "lucide-react";

export default function RecordsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-200/50 text-primary-700">
        <FolderLock size={28} />
      </span>
      <h1 className="mt-5 text-h1 font-bold text-ink-900">Hồ sơ Bệnh án</h1>
      <p className="mt-2 max-w-md text-body-lg text-ink-700">
        Tính năng lưu trữ bệnh án điện tử đang được hoàn thiện và sẽ sớm ra mắt.
      </p>
    </div>
  );
}
