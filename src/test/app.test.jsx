import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
const goto = async (user, name) => user.click(screen.getByRole('link', { name }))

async function addHabit(user, name, target = '5') {
  await goto(user, 'Alışkanlıklar')
  const form = screen.getByRole('form', { name: 'Yeni alışkanlık' })
  await user.type(within(form).getByLabelText(/Alışkanlık/), name)
  await user.clear(within(form).getByLabelText(/Haftalık hedef/))
  await user.type(within(form).getByLabelText(/Haftalık hedef/), target)
  await user.click(within(form).getByRole('button', { name: 'Ekle' }))
}

describe('Uygulama akışı', () => {
  it('boş durumda başlar; doğrulama hata gösterir', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/Henüz alışkanlık yok/)).toBeInTheDocument()
    await goto(user, 'Alışkanlıklar')
    const form = screen.getByRole('form', { name: 'Yeni alışkanlık' })
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))
    expect(within(form).getByText('Ad boş olamaz.')).toBeInTheDocument()
    await user.type(within(form).getByLabelText(/Alışkanlık/), 'Su içmek')
    await user.clear(within(form).getByLabelText(/Haftalık hedef/))
    await user.type(within(form).getByLabelText(/Haftalık hedef/), '9')
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))
    expect(within(form).getByText(/1 ile 7 arasında/)).toBeInTheDocument()
  })

  it('alışkanlık ekler, bugün işaretler, seri ve ilerleme güncellenir', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addHabit(user, 'Kitap okumak')
    await goto(user, 'Bugün')
    expect(screen.getByText('Bugünün ilerlemesi: 0/1')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Kitap okumak: bugün yapılmadı' }))
    expect(screen.getByRole('checkbox', { name: 'Kitap okumak: bugün yapıldı' })).toBeChecked()
    expect(screen.getByText('Bugünün ilerlemesi: 1/1')).toBeInTheDocument()
    expect(screen.getByText(/1 gün seri/)).toBeInTheDocument()
    expect(screen.getByText('Bugünün tüm alışkanlıkları tamam.')).toBeInTheDocument()
  })

  it('geçmiş günü şeritten işaretlemek seriyi uzatır', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addHabit(user, 'Yürüyüş')
    await goto(user, 'Bugün')
    const dots = screen.getAllByRole('button', { name: /^Yürüyüş \d{4}-\d{2}-\d{2}: yapılmadı$/ })
    expect(dots).toHaveLength(7)
    await user.click(dots[6]) // bugün
    await user.click(dots[5]) // dün
    expect(screen.getByText(/2 gün seri/)).toBeInTheDocument()
  })

  it('silme ve geri al; veri yenilemeden sonra kalır', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await addHabit(user, 'Meditasyon', '3')
    await user.click(screen.getByRole('button', { name: 'Meditasyon alışkanlığını sil' }))
    expect(screen.getByText(/Henüz alışkanlık yok/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Geri al' }))
    expect(screen.getByText('Meditasyon', { selector: 'strong' })).toBeInTheDocument()
    unmount()
    render(<App />)
    expect(screen.getByText('Meditasyon', { selector: 'strong' })).toBeInTheDocument()
  })

  it('örnek veri yüklenince istatistik sayfası dolar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await goto(user, 'Veri')
    await user.click(screen.getByRole('button', { name: 'Örnek veriyi yükle' }))
    await goto(user, 'İstatistik')
    expect(screen.getByRole('img', { name: /ısı haritası/ })).toBeInTheDocument()
    expect(screen.getByText('Su içmek (2 litre)')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(5)
  })

  it('düzenleme alışkanlık adını günceller', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addHabit(user, 'Su')
    await user.click(screen.getByRole('button', { name: 'Su alışkanlığını düzenle' }))
    const dlg = screen.getByRole('dialog')
    const input = within(dlg).getByLabelText(/Alışkanlık/)
    await user.clear(input)
    await user.type(input, 'Su içmek')
    await user.click(within(dlg).getByRole('button', { name: 'Kaydet' }))
    expect(screen.getByText('Su içmek', { selector: 'strong' })).toBeInTheDocument()
  })
})
