import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useChangeStationName,
  useChangePassword,
  useUpdateLogo,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Camera, Droplets, Trash2 } from "lucide-react";

const nameSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(4, "يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type NameFormValues = z.infer<typeof nameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logoUrl ?? null);

  const changeName = useChangeStationName();
  const changePassword = useChangePassword();
  const updateLogo = useUpdateLogo();

  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onNameSubmit = (data: NameFormValues) => {
    changeName.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "تم تغيير الاسم بنجاح" });
      }
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate({
      data: { currentPassword: data.currentPassword, newPassword: data.newPassword }
    }, {
      onSuccess: () => { toast({ title: "تم تغيير كلمة المرور بنجاح" }); passwordForm.reset(); },
      onError: () => { toast({ variant: "destructive", title: "فشل تغيير كلمة المرور", description: "تأكد من صحة كلمة المرور الحالية" }); }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { toast({ variant: "destructive", title: "حجم الصورة كبير جداً", description: "يجب أن يكون حجم الصورة أقل من 1MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      updateLogo.mutate({ data: { logoUrl: dataUrl } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); toast({ title: "تم رفع الشعار بنجاح" }); },
        onError: () => { toast({ variant: "destructive", title: "فشل رفع الشعار" }); setLogoPreview(user?.logoUrl ?? null); }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateLogo.mutate({ data: { logoUrl: "" } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); toast({ title: "تم حذف الشعار" }); }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">تعديل معلومات الحساب وإعدادات المحطة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>شعار المحطة</CardTitle>
          <CardDescription>سيظهر الشعار في الشريط الجانبي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="شعار المحطة" className="w-20 h-20 rounded-xl object-cover border-2 border-border" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                  <Droplets className="w-8 h-8 text-primary/40" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={updateLogo.isPending}>
                  <Camera className="w-4 h-4" />
                  {logoPreview ? "تغيير الشعار" : "رفع شعار"}
                </Button>
                {logoPreview && (
                  <Button size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={handleRemoveLogo} disabled={updateLogo.isPending}>
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG أو JPG — الحد الأقصى 1MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المحطة</CardTitle>
          <CardDescription>تغيير اسم العرض للمحطة</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>اسم المستخدم (للدخول)</Label>
                  <Input value={user?.username} disabled className="bg-muted" dir="ltr" />
                </div>
                <FormField control={nameForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <Label>اسم المحطة (للعرض)</Label>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" disabled={changeName.isPending || !nameForm.formState.isDirty}>حفظ الاسم</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
          <CardDescription>احرص على استخدام كلمة مرور قوية لتأمين حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem className="max-w-md">
                  <Label>كلمة المرور الحالية</Label>
                  <FormControl><Input type="password" {...field} dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Separator className="my-4" />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem className="max-w-md">
                  <Label>كلمة المرور الجديدة</Label>
                  <FormControl><Input type="password" {...field} dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem className="max-w-md">
                  <Label>تأكيد كلمة المرور الجديدة</Label>
                  <FormControl><Input type="password" {...field} dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="default" disabled={changePassword.isPending}>تحديث كلمة المرور</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
