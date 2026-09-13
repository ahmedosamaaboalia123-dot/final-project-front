import { useState } from "react";
import { AsyncState, ConfirmAction, ConflictDialog } from "@/shared/components";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import { getArabicErrorMessage, isConflict } from "@/api/apiError";
import { can } from "@/modules/auth/permissions/permission";
import { useAuthStore } from "@/store/authStore";
import {
  useCompleteCashRefund,
  useRetryCashRefund,
  useSweepCashRefunds,
} from "@/modules/admin/refunds/hooks/refund.mutations";
import { firstRefundFormError, refundVersionSchema } from "@/modules/admin/refunds/schemas/refund.schema";
import "./RefundsSection.css";

function readSweepResult(data) {
  const source = data && typeof data === "object" ? data : {};
  return {
    attempted: source.attempted ?? null,
    recovered: source.recovered ?? null,
    stillPending: source.stillPending ?? null,
  };
}

function RefundForm({ title, description, submitLabel, mutation, disabled }) {
  const [refundId, setRefundId] = useState("");
  const [version, setVersion] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const conflicted = mutation.isError && isConflict(mutation.error);
  const errorMessage =
    mutation.isError && !conflicted ? getArabicErrorMessage(mutation.error) : "";

  const submit = (event) => {
    event.preventDefault();
    setSuccess("");
    const trimmedId = refundId.trim();
    if (!trimmedId) {
      setFormError("أدخل معرف الاسترداد");
      return;
    }
    const parsed = refundVersionSchema.safeParse({
      expectedRefundVersion: Number(version),
    });
    if (!parsed.success || version === "") {
      setFormError(firstRefundFormError(parsed) || "أدخل رقم نسخة صحيح");
      return;
    }
    setFormError("");
    mutation.mutate(
      { refundId: String(trimmedId), expectedRefundVersion: parsed.data.expectedRefundVersion },
      { onSuccess: () => setSuccess("تم تنفيذ العملية بنجاح") },
    );
  };

  return (
    <section className="fr-refund-card">
      <h3>{title}</h3>
      <p className="fr-refund-hint">{description}</p>
      <form onSubmit={submit} className="fr-refund-form">
        <Input
          label="معرف الاسترداد"
          name="refundId"
          placeholder="مثال: 66f3a1b2c4d5e6f7890abc12"
          value={refundId}
          onChange={(event) => {
            mutation.resetAttempt();
            setFormError("");
            setSuccess("");
            setRefundId(event.target.value);
          }}
          disabled={disabled || mutation.isPending}
          required
        />
        <Input
          label="رقم النسخة المتوقعة"
          name="expectedRefundVersion"
          type="number"
          min="0"
          step="1"
          placeholder="مثال: 3"
          value={version}
          onChange={(event) => {
            mutation.resetAttempt();
            setFormError("");
            setSuccess("");
            setVersion(event.target.value);
          }}
          disabled={disabled || mutation.isPending}
          required
        />
        <Button type="submit" disabled={disabled || mutation.isPending} loading={mutation.isPending}>
          {submitLabel}
        </Button>
      </form>
      {(formError || errorMessage) && (
        <p className="fr-inline-error" role="alert">
          {formError || errorMessage}
        </p>
      )}
      {success && (
        <p className="fr-inline-success" role="status">
          {success}
        </p>
      )}
      <ConflictDialog
        open={conflicted}
        message="تغير سجل الاسترداد من مستخدم آخر. أحضر أحدث رقم نسخة من تفاصيل الطلب ثم أعد المحاولة."
        onClose={mutation.resetAttempt}
        onReload={mutation.resetAttempt}
        pending={false}
      />
    </section>
  );
}

export default function RefundsSection() {
  const permissions = useAuthStore((state) => state.permissions);
  const canRefund = can(permissions, "payments.refund");
  const sweep = useSweepCashRefunds();
  const complete = useCompleteCashRefund();
  const retry = useRetryCashRefund();

  const sweepResult = sweep.data ? readSweepResult(sweep.data) : null;

  return (
    <section className="fr-section" aria-label="إدارة الاستردادات النقدية">
      <h2>الاستردادات النقدية المعلقة</h2>
      <p className="fr-section-help">
        معرفات الاستردادات المعلقة (refundId) ورقم النسخة (expectedRefundVersion) موجودة في تفاصيل
        الطلب ومدفوعاته. انسخ المعرف ورقم النسخة من هناك ثم نفذ الإتمام أو إعادة المحاولة هنا.
      </p>

      <div className="fr-refund-card">
        <h3>تسوية جماعية للاستردادات</h3>
        <p className="fr-refund-hint">
          يحاول الخادم إتمام كل الاستردادات المعلقة دفعة واحدة ويعيد عدد المحاولات والناجحة
          والمتبقية.
        </p>
        {canRefund ? (
          <ConfirmAction
            title="تسوية الاستردادات"
            message="سيحاول الخادم تسوية كل الاستردادات النقدية المعلقة. هل تريد المتابعة؟"
            confirmLabel="بدء التسوية"
            pending={sweep.isPending}
            onConfirm={() => sweep.mutateAsync({})}
          >
            تسوية المعلقة الآن
          </ConfirmAction>
        ) : (
          <p className="fr-inline-error" role="alert">
            ليس لديك صلاحية تسوية الاستردادات (payments.refund).
          </p>
        )}
        <AsyncState loading={sweep.isPending && !sweepResult} error={sweep.isError ? new Error(getArabicErrorMessage(sweep.error)) : null} onRetry={sweep.reset} empty={false}>
          {sweepResult && (
            <dl className="fr-sweep-result">
              <div>
                <dt>تمت محاولتها</dt>
                <dd>{sweepResult.attempted ?? "—"}</dd>
              </div>
              <div>
                <dt>تمت استعادتها</dt>
                <dd>{sweepResult.recovered ?? "—"}</dd>
              </div>
              <div>
                <dt>ما زالت معلقة</dt>
                <dd>{sweepResult.stillPending ?? "—"}</dd>
              </div>
            </dl>
          )}
        </AsyncState>
      </div>

      {canRefund ? (
        <div className="fr-refund-grid">
          <RefundForm
            title="إتمام استرداد نقدي"
            description="يُتمم استردادًا معلقًا واحدًا باستخدام معرفه ورقم نسخته الحالية."
            submitLabel="إتمام الاسترداد"
            mutation={complete}
            disabled={false}
          />
          <RefundForm
            title="إعادة محاولة استرداد"
            description="يعيد محاولة استرداد فشل سابقًا باستخدام نفس المعرف ورقم النسخة."
            submitLabel="إعادة المحاولة"
            mutation={retry}
            disabled={false}
          />
        </div>
      ) : (
        <p className="fr-inline-error" role="alert">
          نماذج الإتمام وإعادة المحاولة تتطلب صلاحية payments.refund.
        </p>
      )}
    </section>
  );
}
