import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import { useLogin } from "./useLogin";

const loginSchema = z.object({
  name: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(128, "كلمة المرور أطول من المسموح"),
});

function LoginPage() {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });
  return <form onSubmit={handleSubmit(data => login.mutate(data))} style={{ width: "min(92%, 420px)", margin: "80px auto", padding: 24, background: "#fff", borderRadius: 16 }}>
    <h1 style={{ marginBottom: 24 }}>تسجيل الدخول</h1>
    <Input {...register("name")} label="اسم المستخدم" placeholder="أدخل اسم المستخدم" error={errors.name?.message}/>
    <Input {...register("password")} label="كلمة المرور" type="password" placeholder="أدخل كلمة المرور" error={errors.password?.message}/>
    {login.isError && <p role="alert" style={{ color: "var(--danger)", marginBlock: 12 }}>{login.error?.message || "تعذر تسجيل الدخول. تأكد من تشغيل الخادم."}</p>}
    {login.data?.status === "DEVICE_APPROVAL_REQUIRED" && <div role="status" style={{ color: "#9a651c", background: "#fff7e8", padding: 12, borderRadius: 10, marginBlock: 12 }}>
      <p>الجهاز في انتظار موافقة المسؤول.</p>
      <Button type="button" disabled={login.isPending || !login.variables} onClick={() => login.mutate(login.variables)}>التحقق من الموافقة</Button>
    </div>}
    <Button type="submit" disabled={login.isPending}>{login.isPending ? "جاري الدخول..." : "دخول"}</Button>
  </form>;
}
export default LoginPage;
