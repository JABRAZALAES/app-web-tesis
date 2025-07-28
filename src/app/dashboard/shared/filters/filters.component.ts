import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { FiltrosReporte } from '../../../services/reportes.service';
import { ReportesService } from '../../../services/reportes.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class FiltersComponent implements OnInit {
  @Input() filtrosIniciales: FiltrosReporte = {};
  @Output() filtrosCambiados = new EventEmitter<FiltrosReporte>();
  @Output() filtrosAplicados = new EventEmitter<FiltrosReporte>();

  filtrosForm: FormGroup;
  periodosAcademicos: any[] = [];
    laboratorios: any[] = [];
  loading = false;


  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService
  ) {
    this.filtrosForm = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      periodoAcademico: [''],
      laboratorio: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosFiltros();
    this.aplicarFiltrosIniciales();

  }

  cargarDatosFiltros(): void {
    this.loading = true;

    // Cargar períodos académicos
    this.reportesService.getPeriodosAcademicos().subscribe({
      next: (response) => {
        this.periodosAcademicos = response?.data || [];
        // Seleccionar período activo por defecto si no hay uno seleccionado
        if (!this.filtrosForm.get('periodoAcademico')?.value) {
          const activo = this.periodosAcademicos.find(p => p.estado_periodo === 'Activo');
          if (activo) {
            this.filtrosForm.patchValue({ periodoAcademico: activo.id });
          }
        }
      },
      error: (error) => {
        console.error('Error cargando períodos académicos:', error);
      }
    });


// filepath: src/app/dashboard/shared/filters/filters.component.ts
this.reportesService.getLaboratorios().subscribe({
  next: (response) => {
    this.laboratorios = response?.data || [];
    console.log('Laboratorios:', this.laboratorios); // <-- Agrega esto
    this.loading = false;
  },
  error: (error) => {
    console.error('Error cargando laboratorios:', error);
    this.loading = false;
  }
});
  }



  aplicarFiltrosIniciales(): void {
    if (this.filtrosIniciales) {
      this.filtrosForm.patchValue(this.filtrosIniciales);
    }
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;

    // Limpiar filtros vacíos
    const filtrosLimpios: FiltrosReporte = {};
    if (filtros.fechaInicio) filtrosLimpios.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin) filtrosLimpios.fechaFin = filtros.fechaFin;
    if (filtros.periodoAcademico) filtrosLimpios.periodoAcademico = filtros.periodoAcademico;
    if (filtros.laboratorio) filtrosLimpios.laboratorio = filtros.laboratorio;

    this.filtrosAplicados.emit(filtrosLimpios);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.aplicarFiltros();
  }

  onFiltroChange(): void {
    const filtros = this.filtrosForm.value;
    console.log('🔄 Filtro cambiado:', filtros);

    // Emitir siempre los filtros limpios
    const filtrosLimpios: FiltrosReporte = {};
    if (filtros.fechaInicio) filtrosLimpios.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin) filtrosLimpios.fechaFin = filtros.fechaFin;
    if (filtros.periodoAcademico) filtrosLimpios.periodoAcademico = filtros.periodoAcademico;
    if (filtros.laboratorio) filtrosLimpios.laboratorio = filtros.laboratorio;

    console.log('📤 Emitiendo filtros limpios:', filtrosLimpios);
    this.filtrosAplicados.emit(filtrosLimpios);
  }

  getPeriodoSeleccionado(): string {
    const periodoId = this.filtrosForm.get('periodoAcademico')?.value;
    const periodo = this.periodosAcademicos.find(p => p.id === periodoId);
    return periodo ? `${periodo.nombre} (${periodo.estado_periodo})` : 'Seleccionar período';
  }

  getLaboratorioSeleccionado(): string {
    const laboratorioId = this.filtrosForm.get('laboratorio')?.value;
    const laboratorio = this.laboratorios.find((l: any) => l.id === laboratorioId);
    return laboratorio ? laboratorio.nombre : 'Todos los laboratorios';
  }
    // ...existing code...

  getFiltrosActivos(): number {
    let activos = 0;
    if (!this.filtrosForm) return 0;
    const valores = this.filtrosForm.value;
    Object.keys(valores).forEach(key => {
      if (
        valores[key] !== null &&
        valores[key] !== undefined &&
        valores[key] !== '' &&
        !(typeof valores[key] === 'boolean' && valores[key] === false)
      ) {
        activos++;
      }
    });
    return activos;
  }

}
