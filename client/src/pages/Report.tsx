import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * صفحة التقرير القديم تم استبدالها.
 * الآن: دعم الفرضية النهائية يتم من مكتب المحلل،
 * وتسليم التقرير + رد المدير يتم من مكتب المدير.
 */
export default function Report() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/office");
  }, [setLocation]);

  return null;
}
