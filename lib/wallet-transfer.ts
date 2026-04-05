import {
  AllergyRecord,
  ConditionRecord,
  Document,
  MedicationRecord,
  Patient,
  Wallet,
} from "./types";

type UnknownObject = { [key: string]: unknown };

export type WalletExportV1 = {
  version: 1;
  app: "health-wallet";
  exportedAt: string;
  wallet: {
    profile: Patient;
    allergies: AllergyRecord[];
    medications: MedicationRecord[];
    conditions: ConditionRecord[];
    documents: Document[];
    preferences: UnknownObject;
  };
};

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasValidEmergencyContact(value: unknown): boolean {
  if (!isObject(value)) return false;
  return isString(value.name) && isString(value.relationship) && isString(value.phone);
}

function hasValidPatientShape(value: unknown): value is Patient {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.dateOfBirth) &&
    isString(value.preferredLanguage) &&
    hasValidEmergencyContact(value.emergencyContact) &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function validateDocumentShape(doc: unknown, index: number): string | null {
  if (!isObject(doc)) {
    return `Document at index ${index} is not an object`;
  }

  if (!isString(doc.id) || !isString(doc.title)) {
    return `Document at index ${index} is missing id/title`;
  }

  const inferredKind =
    doc.kind === "text" || doc.kind === "file"
      ? doc.kind
      : isString(doc.textContent) || isString(doc.content)
      ? "text"
      : isString(doc.fileContent) || isString(doc.mimeType) || isString(doc.fileName)
      ? "file"
      : null;

  if (!inferredKind) {
    return `Document at index ${index} has invalid kind`;
  }

  const hasValidCreatedAt = isString(doc.createdAt) || isNumber(doc.createdAt);
  const hasValidUpdatedAt = isString(doc.updatedAt) || isNumber(doc.updatedAt);

  if (!hasValidCreatedAt || !hasValidUpdatedAt) {
    return `Document at index ${index} is missing timestamps`;
  }

  if (inferredKind === "text") {
    if (!isString(doc.textContent) && !isString(doc.content)) {
      return `Text document at index ${index} is missing textContent`;
    }
  }

  if (inferredKind === "file") {
    if (!isString(doc.fileContent) || !isString(doc.mimeType)) {
      return `File document at index ${index} is missing fileContent or mimeType`;
    }
  }

  return null;
}

function asAllergyRecords(records: unknown): AllergyRecord[] {
  return (records as AllergyRecord[]).filter((r) => r.type === "allergy");
}

function asMedicationRecords(records: unknown): MedicationRecord[] {
  return (records as MedicationRecord[]).filter((r) => r.type === "medication");
}

function asConditionRecords(records: unknown): ConditionRecord[] {
  return (records as ConditionRecord[]).filter((r) => r.type === "condition");
}

export function buildWalletExport(wallet: Wallet): WalletExportV1 {
  if (!wallet.patient) {
    throw new Error("Cannot export wallet without a profile.");
  }

  const allergies = wallet.records.filter((r) => r.type === "allergy") as AllergyRecord[];
  const medications = wallet.records.filter((r) => r.type === "medication") as MedicationRecord[];
  const conditions = wallet.records.filter((r) => r.type === "condition") as ConditionRecord[];

  return {
    version: 1,
    app: "health-wallet",
    exportedAt: new Date().toISOString(),
    wallet: {
      profile: wallet.patient,
      allergies,
      medications,
      conditions,
      documents: wallet.documents,
      preferences: {
        ...(wallet.preferences || {}),
        preferredLanguage: wallet.patient.preferredLanguage,
      },
    },
  };
}

export function downloadWalletExport(payload: WalletExportV1): void {
  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `health-wallet-export-${datePart}.json`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function validateWalletExportPayload(payload: unknown): {
  ok: true;
  data: WalletExportV1;
} | {
  ok: false;
  error: string;
} {
  if (!isObject(payload)) {
    return { ok: false, error: "Invalid file format: root must be an object." };
  }

  if (payload.version !== 1) {
    return { ok: false, error: "Unsupported export version." };
  }

  if (payload.app !== "health-wallet") {
    return { ok: false, error: "This file is not a health-wallet export." };
  }

  if (!isString(payload.exportedAt)) {
    return { ok: false, error: "Invalid export metadata." };
  }

  if (!isObject(payload.wallet)) {
    return { ok: false, error: "Invalid file format: wallet object is missing." };
  }

  const { profile, allergies, medications, conditions, documents, preferences } = payload.wallet;

  if (!hasValidPatientShape(profile)) {
    return { ok: false, error: "Invalid profile data in export file." };
  }

  if (!Array.isArray(allergies) || !Array.isArray(medications) || !Array.isArray(conditions) || !Array.isArray(documents)) {
    return { ok: false, error: "Invalid file format: wallet collections must be arrays." };
  }

  if (!isObject(preferences)) {
    return { ok: false, error: "Invalid file format: preferences must be an object." };
  }

  for (let i = 0; i < documents.length; i += 1) {
    const documentError = validateDocumentShape(documents[i], i);
    if (documentError) {
      return { ok: false, error: documentError };
    }
  }

  // Ensure collections contain expected record types
  const wrongAllergy = allergies.find((r) => !isObject(r) || r.type !== "allergy");
  if (wrongAllergy) {
    return { ok: false, error: "Invalid allergy records in export file." };
  }

  const wrongMedication = medications.find((r) => !isObject(r) || r.type !== "medication");
  if (wrongMedication) {
    return { ok: false, error: "Invalid medication records in export file." };
  }

  const wrongCondition = conditions.find((r) => !isObject(r) || r.type !== "condition");
  if (wrongCondition) {
    return { ok: false, error: "Invalid condition records in export file." };
  }

  return { ok: true, data: payload as WalletExportV1 };
}

export async function parseWalletExportFile(file: File): Promise<WalletExportV1> {
  const raw = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const validation = validateWalletExportPayload(parsed);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  return validation.data;
}

export function walletFromExport(data: WalletExportV1): Wallet {
  const normalizeTimestamp = (value: unknown): string => {
    if (isString(value)) return value;
    if (isNumber(value)) return new Date(value).toISOString();
    return new Date().toISOString();
  };

  const normalizedDocuments: Document[] = data.wallet.documents.map((doc) => {
    const inferredKind: "text" | "file" =
      doc.kind === "text" || doc.kind === "file"
        ? doc.kind
        : doc.textContent || (doc as any).content
        ? "text"
        : "file";

    const normalizedDoc: Document = {
      ...doc,
      kind: inferredKind,
      textContent:
        inferredKind === "text"
          ? doc.textContent || ((doc as any).content as string | undefined)
          : undefined,
      createdAt: normalizeTimestamp(doc.createdAt),
      updatedAt: normalizeTimestamp(doc.updatedAt),
    };

    return normalizedDoc;
  });

  const records = [
    ...asAllergyRecords(data.wallet.allergies),
    ...asMedicationRecords(data.wallet.medications),
    ...asConditionRecords(data.wallet.conditions),
  ];

  return {
    patient: data.wallet.profile,
    records,
    documents: normalizedDocuments,
    // Shares are intentionally not part of backup/restore because sharing is explicit and separate.
    shares: {},
    preferences: data.wallet.preferences,
  };
}
