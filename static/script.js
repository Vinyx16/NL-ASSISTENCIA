// Global variables
let currentEditingId = null
let nextOSNumber = 1
let osSelecionada = null

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  loadData()
  setupEventListeners()
})

function initializeApp() {
  // Set current date for OS form
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("dataAbertura").value = today

  // Set default date range for dashboard (current month)
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  document.getElementById("dataInicio").value = firstDay
  document.getElementById("dataFim").value = lastDay

  // Update OS number
  updateOSNumber()

  // Calculate totals for OS form
  setupCalculations()
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const section = this.dataset.section
      showSection(section)
      updateActiveNav(this)
    })
  })

  // Forms
  document.getElementById("cadastroForm").addEventListener("submit", handleCadastroSubmit)
  document.getElementById("osForm").addEventListener("submit", handleOSSubmit)
  document.getElementById("garantiaForm").addEventListener("submit", handleGarantiaSubmit)

  // Search
  document.getElementById("searchNome").addEventListener("input", handleSearch)
  document.getElementById("searchOS").addEventListener("input", handleSearch)
  document.getElementById("dataInicioRelatorio").addEventListener("change", handleSearch)
  document.getElementById("dataFimRelatorio").addEventListener("change", handleSearch)

  // Modal events
  document.querySelector(".modal-close").addEventListener("click", closeModal)
  document.querySelector(".notification-close").addEventListener("click", hideNotification)

  // Keyboard events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal()
      fecharModalOS()
    }
  })

  // Click outside modal to close
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target.id === "editModal") {
      closeModal()
    }
  })

  document.getElementById("abrirOSModal").addEventListener("click", (e) => {
    if (e.target.id === "abrirOSModal") {
      fecharModalOS()
    }
  })

  // Dashboard date change
  document.getElementById("dataInicio").addEventListener("change", updateDashboard)
  document.getElementById("dataFim").addEventListener("change", updateDashboard)

  // Dropdown functionality
  setupDropdowns()

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-print")) {
      const dropdown = document.getElementById("printDropdown")
      if (dropdown) dropdown.classList.remove("show")
    }
  })
}

// Modal Abrir OS functions
function abrirModalOS() {
  document.getElementById("abrirOSModal").classList.remove("hidden")
  document.getElementById("selecionarOS").focus()
  setupSelecionarOSDropdown()
}

function fecharModalOS() {
  document.getElementById("abrirOSModal").classList.add("hidden")
  document.getElementById("selecionarOS").value = ""
  document.getElementById("osDetalhes").style.display = "none"
  osSelecionada = null
}

function setupSelecionarOSDropdown() {
  const input = document.getElementById("selecionarOS")
  const dropdown = document.getElementById("selecionarOSDropdown")

  input.addEventListener("input", function () {
    showSelecionarOSDropdown(this.value)
  })

  input.addEventListener("focus", function () {
    if (this.value) showSelecionarOSDropdown(this.value)
  })
}

function showSelecionarOSDropdown(searchTerm) {
  if (!window.appData) return

  const dropdown = document.getElementById("selecionarOSDropdown")
  const filteredOS = window.appData.ordensServico.filter(
    (os) =>
      os.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filteredOS.length === 0) {
    dropdown.classList.remove("show")
    return
  }

  dropdown.innerHTML = filteredOS
    .map(
      (os) => `
    <div class="dropdown-item" onclick="selecionarOSParaEdicao('${os.id}')">
      <div class="item-title">OS #${os.numero} - ${os.cliente}</div>
      <div class="item-subtitle">${os.aparelho} ${os.marca} - Status: ${getStatusLabel(os.status)}</div>
    </div>
  `,
    )
    .join("")

  dropdown.classList.add("show")
}

function selecionarOSParaEdicao(osId) {
  if (!window.appData) return

  osSelecionada = window.appData.ordensServico.find((os) => os.id == osId)
  if (!osSelecionada) return

  // Preencher o input
  document.getElementById("selecionarOS").value = `OS #${osSelecionada.numero} - ${osSelecionada.cliente}`
  document.getElementById("selecionarOSDropdown").classList.remove("show")

  // Mostrar detalhes
  document.getElementById("osNumeroSelecionada").textContent = `OS #${osSelecionada.numero}`
  document.getElementById("novoStatus").value = osSelecionada.status

  // Preencher detalhes
  const detalhesContainer = document.getElementById("detalhesOSSelecionada")
  detalhesContainer.innerHTML = `
    <div class="detail-group">
      <label>Cliente</label>
      <div class="detail-value">${osSelecionada.cliente}</div>
    </div>
    <div class="detail-group">
      <label>Telefone</label>
      <div class="detail-value">${osSelecionada.telefone}</div>
    </div>
    <div class="detail-group">
      <label>E-mail</label>
      <div class="detail-value">${osSelecionada.email || "Não informado"}</div>
    </div>
    <div class="detail-group full-width">
      <label>Endereço</label>
      <div class="detail-value">${osSelecionada.endereco}</div>
    </div>
    <div class="detail-group">
      <label>Aparelho</label>
      <div class="detail-value">${osSelecionada.aparelho}</div>
    </div>
    <div class="detail-group">
      <label>Marca</label>
      <div class="detail-value">${osSelecionada.marca}</div>
    </div>
    <div class="detail-group">
      <label>Modelo</label>
      <div class="detail-value">${osSelecionada.modelo}</div>
    </div>
    <div class="detail-group">
      <label>Técnico</label>
      <div class="detail-value">${osSelecionada.tecnico}</div>
    </div>
    <div class="detail-group">
      <label>Data Abertura</label>
      <div class="detail-value">${new Date(osSelecionada.dataAbertura).toLocaleDateString("pt-BR")}</div>
    </div>
    <div class="detail-group">
      <label>Valor Total</label>
      <div class="detail-value">${formatCurrency(Number.parseFloat(osSelecionada.valor) || 0)}</div>
    </div>
    <div class="detail-group">
      <label>Status Atual</label>
      <div class="detail-value">
        <span class="status-badge status-${osSelecionada.status}">${getStatusLabel(osSelecionada.status)}</span>
      </div>
    </div>
    <div class="detail-group">
      <label>Forma de Pagamento</label>
      <div class="detail-value">${osSelecionada.pagamento}</div>
    </div>
    <div class="detail-group full-width">
      <label>Defeito Informado</label>
      <div class="detail-value textarea-style">${osSelecionada.defeito}</div>
    </div>
    <div class="detail-group full-width">
      <label>Diagnóstico Técnico</label>
      <div class="detail-value textarea-style">${osSelecionada.diagnostico}</div>
    </div>
  `

  document.getElementById("osDetalhes").style.display = "block"
}

async function atualizarStatusOS() {
  if (!osSelecionada) return

  const novoStatus = document.getElementById("novoStatus").value
  if (!novoStatus) {
    showNotification("Selecione um status!", "warning")
    return
  }

  try {
    const response = await fetch(`/api/ordens-servico/${osSelecionada.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...osSelecionada,
        status: novoStatus,
      }),
    })

    if (response.ok) {
      showNotification("Status atualizado com sucesso!", "success")
      fecharModalOS()
      loadData()
    } else {
      throw new Error("Erro ao atualizar status")
    }
  } catch (error) {
    showNotification("Erro ao atualizar status da OS!", "error")
  }
}

function setupDropdowns() {
  // Cliente dropdown for OS
  const clienteInput = document.getElementById("osCliente")
  const clienteDropdown = document.getElementById("clienteDropdown")

  clienteInput.addEventListener("input", function () {
    showClienteDropdown(this.value)
  })

  clienteInput.addEventListener("focus", function () {
    if (this.value) showClienteDropdown(this.value)
  })

  // OS dropdown for Garantia
  const osInput = document.getElementById("garantiaOS")
  const osDropdown = document.getElementById("osDropdown")

  osInput.addEventListener("input", function () {
    showOSDropdown(this.value)
  })

  osInput.addEventListener("focus", function () {
    if (this.value) showOSDropdown(this.value)
  })

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-with-dropdown")) {
      document.querySelectorAll(".dropdown-list").forEach((dropdown) => {
        dropdown.classList.remove("show")
      })
    }
  })
}

function setupCalculations() {
  const valorInput = document.getElementById("valor")
  const parcelasInput = document.getElementById("parcelas")
  const totalInput = document.getElementById("total")

  function calculateTotal() {
    const valor = Number.parseFloat(valorInput.value) || 0
    const parcelas = Number.parseInt(parcelasInput.value) || 1
    const total = valor / parcelas // Dividir em vez de multiplicar
    totalInput.value = total.toFixed(2)
  }

  valorInput.addEventListener("input", calculateTotal)
  parcelasInput.addEventListener("input", calculateTotal)
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  // Show selected section
  document.getElementById(sectionId).classList.add("active")

  // Update data for specific sections
  if (sectionId === "relatorio") {
    updateRelatorio()
  } else if (sectionId === "dashboard") {
    updateDashboard()
  }
}

function updateActiveNav(activeBtn) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  activeBtn.classList.add("active")
}

// Print functions
function togglePrintDropdown() {
  const dropdown = document.getElementById("printDropdown")
  dropdown.classList.toggle("show")
}

function gerarPDF() {
  // Coletar dados do formulário
  const formData = {
    numero: document.getElementById("osNumber").textContent,
    cliente: document.getElementById("osCliente").value,
    telefone: document.getElementById("osTelefone").value,
    endereco: document.getElementById("osEndereco").value,
    email: document.getElementById("osEmail").value,
    aparelho: document.getElementById("aparelho").value,
    marca: document.getElementById("marca").value,
    modelo: document.getElementById("modelo").value,
    defeito: document.getElementById("defeito").value,
    diagnostico: document.getElementById("diagnostico").value,
    tecnico: document.getElementById("tecnico").value,
    status: document.getElementById("osStatus").value,
    dataAbertura: document.getElementById("dataAbertura").value,
    valor: document.getElementById("valor").value,
    parcelas: document.getElementById("parcelas").value,
    total: document.getElementById("total").value,
    pagamento: document.getElementById("pagamento").value,
  }

  // Criar conteúdo HTML melhorado para PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Serviço #${formData.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: white;
          padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding: 30px;
          background: #3b82f6;
          color: white;
          border-radius: 10px;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header h2 { font-size: 1.8rem; opacity: 0.9; }
        .info-section { margin-bottom: 30px; }
        .section-title { 
          font-size: 1.3rem; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin-bottom: 20px; 
        }
        .info-item { 
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .info-item.full-width { grid-column: 1 / -1; }
        .label { 
          font-weight: 600; 
          color: #374151; 
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
          display: block;
        }
        .value { 
          font-size: 1.1rem;
          color: #1f2937;
          font-weight: 500;
        }
        .textarea-value { 
          background: white;
          padding: 15px; 
          border-radius: 6px; 
          border: 1px solid #d1d5db;
          min-height: 80px;
          line-height: 1.5;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-aberto { background: #fef3c7; color: #92400e; }
        .status-em_andamento { background: #dbeafe; color: #1e40af; }
        .status-autorizado { background: #f3e8ff; color: #7c3aed; }
        .status-concluido { background: #dcfce7; color: #166534; }
        .status-suspenso { background: #fef3c7; color: #d97706; }
        .status-cancelado { background: #fee2e2; color: #dc2626; }
        .footer {
          margin-top: 40px;
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          color: #6b7280;
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    </head>
    <body>
      <div class="container" id="content">
        <div class="header">
          <h1>NL Assistência Técnica</h1>
          <h2>Ordem de Serviço #${formData.numero}</h2>
        </div>
        
        <div class="info-section">
          <div class="section-title">Informações do Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Cliente</span>
              <div class="value">${formData.cliente}</div>
            </div>
            <div class="info-item">
              <span class="label">Telefone</span>
              <div class="value">${formData.telefone}</div>
            </div>
            <div class="info-item full-width">
              <span class="label">Endereço</span>
              <div class="value">${formData.endereco}</div>
            </div>
            <div class="info-item">
              <span class="label">E-mail</span>
              <div class="value">${formData.email || "Não informado"}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Informações do Equipamento</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Aparelho</span>
              <div class="value">${formData.aparelho}</div>
            </div>
            <div class="info-item">
              <span class="label">Marca</span>
              <div class="value">${formData.marca}</div>
            </div>
            <div class="info-item">
              <span class="label">Modelo</span>
              <div class="value">${formData.modelo}</div>
            </div>
            <div class="info-item">
              <span class="label">Técnico</span>
              <div class="value">${formData.tecnico}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Status e Datas</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Status</span>
              <div class="value">
                <span class="status-badge status-${formData.status}">${getStatusLabel(formData.status)}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">Data de Abertura</span>
              <div class="value">${new Date(formData.dataAbertura).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Informações Financeiras</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Valor Total</span>
              <div class="value">R$ ${formData.valor}</div>
            </div>
            <div class="info-item">
              <span class="label">Parcelas</span>
              <div class="value">${formData.parcelas}x</div>
            </div>
            <div class="info-item">
              <span class="label">Valor por Parcela</span>
              <div class="value">R$ ${formData.total}</div>
            </div>
            <div class="info-item">
              <span class="label">Forma de Pagamento</span>
              <div class="value">${formData.pagamento}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Descrições Técnicas</div>
          <div class="info-item full-width">
            <span class="label">Defeito Informado pelo Cliente</span>
            <div class="textarea-value">${formData.defeito}</div>
          </div>
          <div class="info-item full-width">
            <span class="label">Diagnóstico Técnico</span>
            <div class="textarea-value">${formData.diagnostico}</div>
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          <p>NL Assistência Técnica - Sistema de Gestão</p>
        </div>
      </div>

      <script>
        function getStatusLabel(status) {
          const labels = {
            aberto: "Aberto",
            autorizado: "Autorizado",
            em_andamento: "Em Andamento",
            concluido: "Concluído",
            suspenso: "Suspenso",
            cancelado: "Cancelado",
            sem_os: "Sem OS",
          }
          return labels[status] || status
        }

        window.onload = function() {
          const { jsPDF } = window.jspdf;
          
          html2canvas(document.getElementById('content'), {
            scale: 2,
            useCORS: true,
            allowTaint: true
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            pdf.save('OS_${formData.numero}_${formData.cliente.replace(/\s+/g, "_")}.pdf');
            window.close();
          });
        }
      </script>
    </body>
    </html>
  `

  // Abrir nova janela para gerar PDF
  const printWindow = window.open("", "_blank")
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  document.getElementById("printDropdown").classList.remove("show")
  showNotification("Gerando PDF para download...", "success")
}

function imprimirOS() {
  // Coletar dados do formulário
  const formData = {
    numero: document.getElementById("osNumber").textContent,
    cliente: document.getElementById("osCliente").value,
    telefone: document.getElementById("osTelefone").value,
    endereco: document.getElementById("osEndereco").value,
    email: document.getElementById("osEmail").value,
    aparelho: document.getElementById("aparelho").value,
    marca: document.getElementById("marca").value,
    modelo: document.getElementById("modelo").value,
    defeito: document.getElementById("defeito").value,
    diagnostico: document.getElementById("diagnostico").value,
    tecnico: document.getElementById("tecnico").value,
    status: document.getElementById("osStatus").value,
    dataAbertura: document.getElementById("dataAbertura").value,
    valor: document.getElementById("valor").value,
    parcelas: document.getElementById("parcelas").value,
    total: document.getElementById("total").value,
    pagamento: document.getElementById("pagamento").value,
  }

  // Criar conteúdo HTML para impressão
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Serviço #${formData.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: white;
          padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding: 30px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-radius: 10px;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header h2 { font-size: 1.8rem; opacity: 0.9; }
        .info-section { margin-bottom: 30px; }
        .section-title { 
          font-size: 1.3rem; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin-bottom: 20px; 
        }
        .info-item { 
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .info-item.full-width { grid-column: 1 / -1; }
        .label { 
          font-weight: 600; 
          color: #374151; 
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
          display: block;
        }
        .value { 
          font-size: 1.1rem;
          color: #1f2937;
          font-weight: 500;
        }
        .textarea-value { 
          background: white;
          padding: 15px; 
          border-radius: 6px; 
          border: 1px solid #d1d5db;
          min-height: 80px;
          line-height: 1.5;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-aberto { background: #fef3c7; color: #92400e; }
        .status-em_andamento { background: #dbeafe; color: #1e40af; }
        .status-autorizado { background: #f3e8ff; color: #7c3aed; }
        .status-concluido { background: #dcfce7; color: #166534; }
        .status-suspenso { background: #fef3c7; color: #d97706; }
        .status-cancelado { background: #fee2e2; color: #dc2626; }
        .footer {
          margin-top: 40px;
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          color: #6b7280;
        }
        @media print {
          body { background: white; padding: 0; }
          .container { max-width: none; }
          .header { background: #3b82f6 !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NL Assistência Técnica</h1>
          <h2>Ordem de Serviço #${formData.numero}</h2>
        </div>
        
        <div class="info-section">
          <div class="section-title">Informações do Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Cliente</span>
              <div class="value">${formData.cliente}</div>
            </div>
            <div class="info-item">
              <span class="label">Telefone</span>
              <div class="value">${formData.telefone}</div>
            </div>
            <div class="info-item full-width">
              <span class="label">Endereço</span>
              <div class="value">${formData.endereco}</div>
            </div>
            <div class="info-item">
              <span class="label">E-mail</span>
              <div class="value">${formData.email || "Não informado"}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Informações do Equipamento</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Aparelho</span>
              <div class="value">${formData.aparelho}</div>
            </div>
            <div class="info-item">
              <span class="label">Marca</span>
              <div class="value">${formData.marca}</div>
            </div>
            <div class="info-item">
              <span class="label">Modelo</span>
              <div class="value">${formData.modelo}</div>
            </div>
            <div class="info-item">
              <span class="label">Técnico</span>
              <div class="value">${formData.tecnico}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Status e Datas</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Status</span>
              <div class="value">
                <span class="status-badge status-${formData.status}">${getStatusLabel(formData.status)}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">Data de Abertura</span>
              <div class="value">${new Date(formData.dataAbertura).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Informações Financeiras</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Valor Total</span>
              <div class="value">R$ ${formData.valor}</div>
            </div>
            <div class="info-item">
              <span class="label">Parcelas</span>
              <div class="value">${formData.parcelas}x</div>
            </div>
            <div class="info-item">
              <span class="label">Valor por Parcela</span>
              <div class="value">R$ ${formData.total}</div>
            </div>
            <div class="info-item">
              <span class="label">Forma de Pagamento</span>
              <div class="value">${formData.pagamento}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="section-title">Descrições Técnicas</div>
          <div class="info-item full-width">
            <span class="label">Defeito Informado pelo Cliente</span>
            <div class="textarea-value">${formData.defeito}</div>
          </div>
          <div class="info-item full-width">
            <span class="label">Diagnóstico Técnico</span>
            <div class="textarea-value">${formData.diagnostico}</div>
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          <p>NL Assistência Técnica - Sistema de Gestão</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Abrir nova janela e imprimir diretamente
  const printWindow = window.open("", "_blank")
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      // Fechar a janela após imprimir
      printWindow.onafterprint = () => {
        printWindow.close()
      }
    }, 500)
  }

  document.getElementById("printDropdown").classList.remove("show")
  showNotification("Abrindo janela de impressão...", "info")
}

// Form handlers
async function handleCadastroSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)

  try {
    const response = await fetch("/api/clientes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      showNotification("Cliente cadastrado com sucesso!", "success")
      e.target.reset()
      loadData()
    } else {
      throw new Error("Erro ao cadastrar cliente")
    }
  } catch (error) {
    showNotification("Erro ao cadastrar cliente!", "error")
  }
}

async function handleOSSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)
  data.numero = document.getElementById("osNumber").textContent

  try {
    const response = await fetch("/api/ordens-servico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      showNotification("Ordem de Serviço salva com sucesso!", "success")
      e.target.reset()
      updateOSNumber()
      loadData()
    } else {
      throw new Error("Erro ao salvar OS")
    }
  } catch (error) {
    showNotification("Erro ao salvar Ordem de Serviço!", "error")
  }
}

async function handleGarantiaSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)

  try {
    const response = await fetch("/api/garantias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      showNotification("Garantia registrada com sucesso!", "success")
      e.target.reset()
      loadData()
    } else {
      throw new Error("Erro ao registrar garantia")
    }
  } catch (error) {
    showNotification("Erro ao registrar garantia!", "error")
  }
}

// Data loading
async function loadData() {
  try {
    // Load all data
    const [clientesRes, osRes, garantiasRes] = await Promise.all([
      fetch("/api/clientes"),
      fetch("/api/ordens-servico"),
      fetch("/api/garantias"),
    ])

    const clientes = await clientesRes.json()
    const ordensServico = await osRes.json()
    const garantias = await garantiasRes.json()

    // Update global data
    window.appData = { clientes, ordensServico, garantias }

    // Update OS number
    nextOSNumber = Math.max(...ordensServico.map((os) => Number.parseInt(os.numero) || 0), 0) + 1
    updateOSNumber()

    // Update metrics
    updateMetrics()

    // Update dashboard if it's the active section
    updateDashboard()
  } catch (error) {
    console.error("Error loading data:", error)
    showNotification("Erro ao carregar dados!", "error")
  }
}

function updateOSNumber() {
  document.getElementById("osNumber").textContent = nextOSNumber.toString().padStart(3, "0")
}

function updateMetrics() {
  if (!window.appData) return

  const { clientes, ordensServico } = window.appData

  const totalClientes = clientes.length
  const totalOS = ordensServico.length
  const faturamentoTotal = ordensServico.reduce((acc, os) => acc + (Number.parseFloat(os.valor) || 0), 0)
  const ticketMedio = totalOS > 0 ? faturamentoTotal / totalOS : 0

  // Update metric displays (apenas no dashboard se existirem)
  const totalClientesEl = document.getElementById("totalClientes")
  const totalOSEl = document.getElementById("totalOS")
  const faturamentoTotalEl = document.getElementById("faturamentoTotal")
  const ticketMedioEl = document.getElementById("ticketMedio")

  if (totalClientesEl) totalClientesEl.textContent = totalClientes
  if (totalOSEl) totalOSEl.textContent = totalOS
  if (faturamentoTotalEl) faturamentoTotalEl.textContent = formatCurrency(faturamentoTotal)
  if (ticketMedioEl) ticketMedioEl.textContent = formatCurrency(ticketMedio)
}

// Search functionality
function handleSearch() {
  const searchNome = document.getElementById("searchNome").value.toLowerCase()
  const searchOS = document.getElementById("searchOS").value.toLowerCase()
  const dataInicio = document.getElementById("dataInicioRelatorio").value
  const dataFim = document.getElementById("dataFimRelatorio").value

  if (!searchNome && !searchOS && !dataInicio && !dataFim) {
    showEmptySearch()
    return
  }

  if (!window.appData) return

  const { clientes, ordensServico } = window.appData

  const filteredClientes = clientes.filter((cliente) => {
    const matchNome = cliente.nome.toLowerCase().includes(searchNome)
    const clienteOS = ordensServico.filter((os) => os.cliente === cliente.nome)

    // Mudança aqui: busca exata por número de OS
    const matchOS = searchOS ? clienteOS.some((os) => os.numero.toLowerCase() === searchOS) : true

    // Filtro por data
    let matchData = true
    if (dataInicio || dataFim) {
      const clienteDataCadastro = new Date(cliente.data_cadastro)
      if (dataInicio) {
        matchData = matchData && clienteDataCadastro >= new Date(dataInicio)
      }
      if (dataFim) {
        matchData = matchData && clienteDataCadastro <= new Date(dataFim)
      }
    }

    // Se está pesquisando por OS específica, só mostrar se o cliente tem essa OS
    if (searchOS) {
      return matchOS && matchData
    }

    // Se está pesquisando por nome, mostrar se o nome bate
    if (searchNome) {
      return matchNome && matchData
    }

    // Se só tem filtro de data
    return matchData
  })

  updateRelatorioTable(filteredClientes)
}

function showEmptySearch() {
  const tbody = document.getElementById("relatorioTableBody")
  tbody.innerHTML = `
        <tr class="no-results">
            <td colspan="8">
                <div class="no-results-content">
                    <i class="fas fa-search"></i>
                    <p>Digite um nome, número de OS ou selecione um período para pesquisar</p>
                </div>
            </td>
        </tr>
    `
}

function updateRelatorio() {
  const searchNome = document.getElementById("searchNome").value
  const searchOS = document.getElementById("searchOS").value
  const dataInicio = document.getElementById("dataInicioRelatorio").value
  const dataFim = document.getElementById("dataFimRelatorio").value

  if (!searchNome && !searchOS && !dataInicio && !dataFim) {
    showEmptySearch()
  } else {
    handleSearch()
  }
}

function updateRelatorioTable(clientes) {
  const tbody = document.getElementById("relatorioTableBody")
  const searchOS = document.getElementById("searchOS").value.toLowerCase()

  if (clientes.length === 0) {
    tbody.innerHTML = `
            <tr class="no-results">
                <td colspan="8">
                    <div class="no-results-content">
                        <i class="fas fa-user-times"></i>
                        <p>Nenhum cliente encontrado</p>
                    </div>
                </td>
            </tr>
        `
    return
  }

  // Criar array com todas as OS dos clientes filtrados
  const todasOS = []
  clientes.forEach((cliente) => {
    const clienteOS = window.appData.ordensServico.filter((os) => os.cliente === cliente.nome)

    if (clienteOS.length > 0) {
      // Se está pesquisando por OS específica, filtrar apenas essa OS
      const osFiltradas = searchOS ? clienteOS.filter((os) => os.numero.toLowerCase() === searchOS) : clienteOS

      // Adicionar cada OS como uma linha separada
      osFiltradas.forEach((os) => {
        todasOS.push({
          cliente: cliente,
          os: os,
        })
      })
    } else if (!searchOS) {
      // Se cliente não tem OS e não está pesquisando por OS específica, ainda mostrar o cliente
      todasOS.push({
        cliente: cliente,
        os: null,
      })
    }
  })

  // Ordenar por número da OS (mais recente primeiro)
  todasOS.sort((a, b) => {
    if (!a.os && !b.os) return 0
    if (!a.os) return 1
    if (!b.os) return -1
    return Number.parseInt(b.os.numero) - Number.parseInt(a.os.numero)
  })

  tbody.innerHTML = todasOS
    .map(({ cliente, os }) => {
      if (!os) {
        // Cliente sem OS
        const dataCadastro = new Date(cliente.data_cadastro).toLocaleDateString("pt-BR")
        return `
          <tr>
              <td class="font-medium text-gray-500">-</td>
              <td class="font-medium">${cliente.nome}</td>
              <td>${cliente.telefone}</td>
              <td class="text-sm text-gray-500">-</td>
              <td class="font-medium text-gray-500">R$ 0,00</td>
              <td class="text-sm">${dataCadastro}</td>
              <td><span class="status-badge status-sem_os">Sem OS</span></td>
              <td>
                  <button class="action-btn delete" onclick="deleteCliente(${cliente.id})" title="Excluir">
                      <i class="fas fa-trash"></i>
                  </button>
              </td>
          </tr>
        `
      } else {
        // Cliente com OS
        const aparelho = `${os.aparelho} ${os.marca} ${os.modelo}`
        const valorTotal = Number.parseFloat(os.valor) || 0
        const dataOS = new Date(os.dataAbertura).toLocaleDateString("pt-BR")

        return `
          <tr>
              <td class="font-medium text-blue-600">${os.numero}</td>
              <td class="font-medium">${cliente.nome}</td>
              <td>${cliente.telefone}</td>
              <td class="text-sm">${aparelho}</td>
              <td class="font-medium text-green-600">${formatCurrency(valorTotal)}</td>
              <td class="text-sm">${dataOS}</td>
              <td><span class="status-badge status-${os.status}">${getStatusLabel(os.status)}</span></td>
              <td>
                  <button class="action-btn view" onclick="viewClienteOS(${cliente.id})" title="Ver OS">
                      <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-btn delete" onclick="deleteCliente(${cliente.id})" title="Excluir">
                      <i class="fas fa-trash"></i>
                  </button>
              </td>
          </tr>
        `
      }
    })
    .join("")
}

// Dashboard functionality
function updateDashboard() {
  if (!window.appData) return

  const { clientes, ordensServico, garantias } = window.appData
  const dataInicio = document.getElementById("dataInicio").value
  const dataFim = document.getElementById("dataFim").value

  // Se não há filtro de data, usar todas as OS
  let osPeriodo = ordensServico

  if (dataInicio && dataFim) {
    // Filter OS by date range
    osPeriodo = ordensServico.filter((os) => {
      const dataOS = new Date(os.dataAbertura)
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      return dataOS >= inicio && dataOS <= fim
    })
  }

  // Calculate metrics
  const totalOS = osPeriodo.length
  const clientesAtivos = new Set(osPeriodo.map((os) => os.cliente)).size

  // Status counts
  const statusCounts = {
    aberto: osPeriodo.filter((os) => os.status === "aberto").length,
    autorizado: osPeriodo.filter((os) => os.status === "autorizado").length,
    em_andamento: osPeriodo.filter((os) => os.status === "em_andamento").length,
    concluido: osPeriodo.filter((os) => os.status === "concluido").length,
    suspenso: osPeriodo.filter((os) => os.status === "suspenso").length,
    cancelado: osPeriodo.filter((os) => os.status === "cancelado").length,
  }

  // Update dashboard displays
  const dashTotalOSEl = document.getElementById("dashTotalOS")
  const dashClientesAtivosEl = document.getElementById("dashClientesAtivos")
  const dashAbertasEl = document.getElementById("dashAbertas")
  const dashEmAndamentoEl = document.getElementById("dashEmAndamento")
  const dashAutorizadasEl = document.getElementById("dashAutorizadas")
  const dashConcluidasEl = document.getElementById("dashConcluidas")
  const dashSuspensasEl = document.getElementById("dashSuspensas")
  const dashCanceladasEl = document.getElementById("dashCanceladas")

  if (dashTotalOSEl) dashTotalOSEl.textContent = totalOS
  if (dashClientesAtivosEl) dashClientesAtivosEl.textContent = clientesAtivos
  if (dashAbertasEl) dashAbertasEl.textContent = statusCounts.aberto
  if (dashEmAndamentoEl) dashEmAndamentoEl.textContent = statusCounts.em_andamento
  if (dashAutorizadasEl) dashAutorizadasEl.textContent = statusCounts.autorizado
  if (dashConcluidasEl) dashConcluidasEl.textContent = statusCounts.concluido
  if (dashSuspensasEl) dashSuspensasEl.textContent = statusCounts.suspenso
  if (dashCanceladasEl) dashCanceladasEl.textContent = statusCounts.cancelado
}

function updateStatusChart(statusCounts) {
  const statusList = document.getElementById("statusList")
  const statusData = [
    { label: "Abertas", count: statusCounts.aberto, color: "yellow" },
    { label: "Em Andamento", count: statusCounts.em_andamento, color: "blue" },
    { label: "Autorizadas", count: statusCounts.autorizado, color: "purple" },
    { label: "Concluídas", count: statusCounts.concluido, color: "green" },
    { label: "Suspensas", count: statusCounts.suspenso, color: "orange" },
    { label: "Canceladas", count: statusCounts.cancelado, color: "red" },
  ]

  statusList.innerHTML = statusData
    .map(
      (item) => `
        <div class="status-item">
            <div class="status-item-info">
                <div class="status-dot ${item.color}"></div>
                <span>${item.label}</span>
            </div>
            <span class="font-semibold">${item.count}</span>
        </div>
    `,
    )
    .join("")
}

// Dropdown functionality
function showClienteDropdown(searchTerm) {
  if (!window.appData) return

  const dropdown = document.getElementById("clienteDropdown")
  const filteredClientes = window.appData.clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filteredClientes.length === 0) {
    dropdown.classList.remove("show")
    return
  }

  dropdown.innerHTML = filteredClientes
    .map(
      (cliente) => `
        <div class="dropdown-item" onclick="selectCliente('${cliente.nome}', '${cliente.endereco}', '${cliente.telefone}', '${cliente.email}')">
            <div class="item-title">${cliente.nome}</div>
            <div class="item-subtitle">${cliente.telefone}</div>
        </div>
    `,
    )
    .join("")

  dropdown.classList.add("show")
}

function showOSDropdown(searchTerm) {
  if (!window.appData) return

  const dropdown = document.getElementById("osDropdown")
  const filteredOS = window.appData.ordensServico.filter((os) =>
    os.numero.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filteredOS.length === 0) {
    dropdown.classList.remove("show")
    return
  }

  dropdown.innerHTML = filteredOS
    .map(
      (os) => `
        <div class="dropdown-item" onclick="selectOS('${os.numero}', '${os.cliente}', '${os.telefone}')">
            <div class="item-title">OS #${os.numero}</div>
            <div class="item-subtitle">${os.cliente} - ${os.aparelho}</div>
        </div>
    `,
    )
    .join("")

  dropdown.classList.add("show")
}

function selectCliente(nome, endereco, telefone, email) {
  document.getElementById("osCliente").value = nome
  document.getElementById("osEndereco").value = endereco
  document.getElementById("osTelefone").value = telefone
  document.getElementById("osEmail").value = email
  document.getElementById("clienteDropdown").classList.remove("show")
}

function selectOS(numero, cliente, telefone) {
  document.getElementById("garantiaOS").value = numero
  document.getElementById("garantiaNome").value = cliente
  document.getElementById("garantiaTelefone").value = telefone
  document.getElementById("osDropdown").classList.remove("show")
}

// View Cliente OS
function viewClienteOS(clienteId) {
  if (!window.appData) return

  const cliente = window.appData.clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  const clienteOS = window.appData.ordensServico.filter((os) => os.cliente === cliente.nome)

  if (clienteOS.length === 0) {
    showNotification("Este cliente não possui ordens de serviço!", "warning")
    return
  }

  // Mostrar modal com as OS do cliente
  const modalContent = `
    <div class="modal-header">
      <h3>Ordens de Serviço - ${cliente.nome}</h3>
      <button class="modal-close" onclick="closeModal()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      ${clienteOS
        .map(
          (os) => `
        <div class="os-card">
          <div class="os-card-header">
            <div class="os-number">OS #${os.numero}</div>
            <span class="status-badge status-${os.status}">${getStatusLabel(os.status)}</span>
          </div>
          <div class="os-details">
            <div class="detail-group">
              <label>Cliente</label>
              <div class="detail-value">${os.cliente}</div>
            </div>
            <div class="detail-group">
              <label>Telefone</label>
              <div class="detail-value">${os.telefone}</div>
            </div>
            <div class="detail-group">
              <label>E-mail</label>
              <div class="detail-value">${os.email || "Não informado"}</div>
            </div>
            <div class="detail-group full-width">
              <label>Endereço</label>
              <div class="detail-value">${os.endereco}</div>
            </div>
            <div class="detail-group">
              <label>Aparelho</label>
              <div class="detail-value">${os.aparelho}</div>
            </div>
            <div class="detail-group">
              <label>Marca</label>
              <div class="detail-value">${os.marca}</div>
            </div>
            <div class="detail-group">
              <label>Modelo</label>
              <div class="detail-value">${os.modelo}</div>
            </div>
            <div class="detail-group">
              <label>Técnico</label>
              <div class="detail-value">${os.tecnico}</div>
            </div>
            <div class="detail-group">
              <label>Data Abertura</label>
              <div class="detail-value">${new Date(os.dataAbertura).toLocaleDateString("pt-BR")}</div>
            </div>
            <div class="detail-group">
              <label>Data Autorização</label>
              <div class="detail-value">${
                os.dataAutorizacao ? new Date(os.dataAutorizacao).toLocaleDateString("pt-BR") : "Não informado"
              }</div>
            </div>
            <div class="detail-group">
              <label>Data Encerramento</label>
              <div class="detail-value">${
                os.dataEncerramento ? new Date(os.dataEncerramento).toLocaleDateString("pt-BR") : "Não informado"
              }</div>
            </div>
            <div class="detail-group">
              <label>Valor Total</label>
              <div class="detail-value">${formatCurrency(Number.parseFloat(os.valor) || 0)}</div>
            </div>
            <div class="detail-group">
              <label>Parcelas</label>
              <div class="detail-value">${os.parcelas}x</div>
            </div>
            <div class="detail-group">
              <label>Valor por Parcela</label>
              <div class="detail-value">${formatCurrency(Number.parseFloat(os.total) || 0)}</div>
            </div>
            <div class="detail-group">
              <label>Forma de Pagamento</label>
              <div class="detail-value">${os.pagamento}</div>
            </div>
            <div class="detail-group full-width">
              <label>Defeito Informado</label>
              <div class="detail-value textarea-style">${os.defeito}</div>
            </div>
            <div class="detail-group full-width">
              <label>Diagnóstico Técnico</label>
              <div class="detail-value textarea-style">${os.diagnostico}</div>
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `

  document.querySelector(".modal-content").innerHTML = modalContent
  document.getElementById("editModal").classList.remove("hidden")
}

// CRUD operations
async function deleteCliente(id) {
  if (!window.appData) return

  const cliente = window.appData.clientes.find((c) => c.id === id)
  if (!cliente) return

  if (!confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome}?`)) return

  try {
    const response = await fetch(`/api/clientes/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      showNotification("Cliente excluído com sucesso!", "success")
      loadData()
      updateRelatorio()
    } else {
      throw new Error("Erro ao excluir cliente")
    }
  } catch (error) {
    showNotification("Erro ao excluir cliente!", "error")
  }
}

// Utility functions
function limparFormulario(formId) {
  document.getElementById(formId).reset()
  if (formId === "osForm") {
    document.getElementById("total").value = ""
  }
}

function enviarWhatsApp(type) {
  let telefone, message

  if (type === "os") {
    telefone = document.getElementById("osTelefone").value
    const osNumber = document.getElementById("osNumber").textContent
    const cliente = document.getElementById("osCliente").value
    const endereco = document.getElementById("osEndereco").value
    const email = document.getElementById("osEmail").value
    const aparelho = document.getElementById("aparelho").value
    const marca = document.getElementById("marca").value
    const modelo = document.getElementById("modelo").value
    const defeito = document.getElementById("defeito").value
    const diagnostico = document.getElementById("diagnostico").value
    const tecnico = document.getElementById("tecnico").value
    const status = document.getElementById("osStatus").value
    const dataAbertura = document.getElementById("dataAbertura").value
    const dataAutorizacao = document.getElementById("dataAutorizacao").value
    const dataEncerramento = document.getElementById("dataEncerramento").value
    const pagamento = document.getElementById("pagamento").value
    const valor = document.getElementById("valor").value
    const parcelas = document.getElementById("parcelas").value
    const total = document.getElementById("total").value

    message =
      `*ORDEM DE SERVIÇO #${osNumber}*\n\n` +
      `*INFORMAÇÕES DO CLIENTE*\n` +
      `*Cliente:* ${cliente}\n` +
      `*Telefone:* ${telefone}\n` +
      `*Endereço:* ${endereco}\n` +
      `*E-mail:* ${email || "Não informado"}\n\n` +
      `*INFORMAÇÕES DO EQUIPAMENTO*\n` +
      `*Aparelho:* ${aparelho}\n` +
      `*Marca:* ${marca}\n` +
      `*Modelo:* ${modelo}\n` +
      `*Técnico Responsável:* ${tecnico}\n\n` +
      `*STATUS E DATAS*\n` +
      `*Status:* ${getStatusLabel(status)}\n` +
      `*Data de Abertura:* ${new Date(dataAbertura).toLocaleDateString("pt-BR")}\n` +
      `*Data de Autorização:* ${dataAutorizacao ? new Date(dataAutorizacao).toLocaleDateString("pt-BR") : "Não informado"}\n` +
      `*Data de Encerramento:* ${dataEncerramento ? new Date(dataEncerramento).toLocaleDateString("pt-BR") : "Não informado"}\n\n` +
      `*INFORMAÇÕES FINANCEIRAS*\n` +
      `*Valor Total:* R$ ${valor}\n` +
      `*Número de Parcelas:* ${parcelas}x\n` +
      `*Valor por Parcela:* R$ ${total}\n` +
      `*Forma de Pagamento:* ${pagamento}\n\n` +
      `*DESCRIÇÕES TÉCNICAS*\n` +
      `*Defeito Informado pelo Cliente:*\n${defeito}\n\n` +
      `*Diagnóstico Técnico:*\n${diagnostico}\n\n` +
      `_NL Assistência Técnica_`
  } else if (type === "garantia") {
    telefone = document.getElementById("garantiaTelefone").value
    const nome = document.getElementById("garantiaNome").value
    const osNumero = document.getElementById("garantiaOS").value
    const cobertura = document.getElementById("cobertura").value
    const pecas = document.getElementById("pecas").value
    const contrato = document.getElementById("contrato").value

    message =
      `*GARANTIA - OS #${osNumero}*\n\n` +
      `*Cliente:* ${nome}\n` +
      `*Telefone:* ${telefone}\n` +
      `*Cobertura:* ${cobertura}\n` +
      `*Peças:* ${pecas}\n\n` +
      `*Contrato de Garantia:*\n${contrato}\n\n` +
      `_NL Assistência Técnica_`
  }

  if (!telefone) {
    showNotification("Telefone é obrigatório para enviar WhatsApp!", "warning")
    return
  }

  const whatsappUrl = `https://wa.me/${telefone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
  showNotification("Redirecionando para WhatsApp!", "info")
}

function closeModal() {
  document.getElementById("editModal").classList.add("hidden")
  currentEditingId = null
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const icon = notification.querySelector(".notification-icon")
  const messageEl = notification.querySelector(".notification-message")

  // Set icon based on type
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  icon.className = `notification-icon ${icons[type]}`
  messageEl.textContent = message
  notification.className = `notification ${type}`

  // Auto hide after 3 seconds
  setTimeout(() => {
    hideNotification()
  }, 3000)
}

function hideNotification() {
  document.getElementById("notification").classList.add("hidden")
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function getStatusLabel(status) {
  const labels = {
    aberto: "Aberto",
    em_andamento: "Em Andamento",
    autorizado: "Autorizado",
    concluido: "Concluído",
    suspenso: "Suspenso",
    cancelado: "Cancelado",
    sem_os: "Sem OS",
  }
  return labels[status] || status
}
