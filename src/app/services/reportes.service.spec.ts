import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let service: ReportesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule] // <-- Agrega esto
    });
    service = TestBed.inject(ReportesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
