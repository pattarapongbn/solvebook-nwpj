import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว",
  description: "การเก็บและใช้ข้อมูลส่วนบุคคลของลูกค้าตาม PDPA",
};

// ตั้ง NEXT_PUBLIC_SHOP_CONTACT ใน env ให้เป็นอีเมลหรือเบอร์ที่ลูกค้าติดต่อเรื่องข้อมูลได้
const CONTACT = process.env.NEXT_PUBLIC_SHOP_CONTACT ?? "";
const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME ?? "ร้านค้า";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 text-[15px] leading-relaxed text-gray-800">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว</h1>
        <p className="mt-1 text-sm text-gray-500">
          {SHOP_NAME} · ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        </p>
      </div>

      <Section title="เราเก็บข้อมูลอะไรบ้าง">
        <ul className="list-disc space-y-1 pl-5">
          <li>ชื่อ–นามสกุล และเบอร์โทรศัพท์ของผู้รับสินค้า</li>
          <li>ที่อยู่จัดส่ง (บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์) และหมายเหตุถึงคนส่ง</li>
          <li>รูปสลิปโอนเงินและเลขอ้างอิงธุรกรรมที่อยู่บนสลิป</li>
          <li>รายการสินค้าและยอดเงินของแต่ละคำสั่งซื้อ</li>
        </ul>
      </Section>

      <Section title="เก็บไปทำอะไร">
        <p>
          ใช้เพื่อจัดส่งสินค้า ตรวจสอบว่าเงินเข้าตรงกับคำสั่งซื้อของคุณ ติดต่อกลับเรื่องออเดอร์
          และเก็บเป็นหลักฐานการซื้อขายเท่านั้น เราไม่ขายหรือให้เช่าข้อมูลของคุณกับใคร
          และไม่ใช้ทำการตลาดกับบุคคลที่สาม
        </p>
      </Section>

      <Section title="ใครเห็นข้อมูลบ้าง">
        <p>
          พนักงานของร้านที่ดูแลคำสั่งซื้อ และบริษัทขนส่งที่นำส่งพัสดุ (เฉพาะชื่อ เบอร์โทร
          และที่อยู่ที่จำเป็นต่อการส่ง) ข้อมูลทั้งหมดเก็บอยู่ในระบบฐานข้อมูลของร้านเอง
        </p>
      </Section>

      <Section title="เก็บไว้นานแค่ไหน">
        <p>
          เก็บไว้เท่าที่จำเป็นต่อการจัดส่ง การรับประกัน และการทำบัญชีตามที่กฎหมายกำหนด
          เมื่อพ้นความจำเป็นแล้วจะลบหรือทำให้ไม่สามารถระบุตัวตนได้
        </p>
      </Section>

      <Section title="สิทธิของคุณ">
        <p>
          คุณมีสิทธิขอดู ขอแก้ไข ขอสำเนา ขอให้ระงับการใช้ หรือ<strong>ขอให้ลบข้อมูล</strong>
          ส่วนบุคคลของคุณได้ตลอดเวลา รวมถึงถอนความยินยอมที่เคยให้ไว้
          เมื่อได้รับคำขอเราจะดำเนินการให้โดยเร็ว
        </p>
      </Section>

      <Section title="ติดต่อเรื่องข้อมูลส่วนบุคคล">
        {CONTACT ? (
          <p>{CONTACT}</p>
        ) : (
          <p className="text-gray-500">
            กรุณาติดต่อร้านผ่านช่องทางที่คุณสั่งซื้อ (แชทเพจหรือเบอร์โทรของร้าน)
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
