package com.project.aura.SupplyChain.Service;

import com.project.aura.Entity.Hospital;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.SupplyChain.DTO.*;
import com.project.aura.SupplyChain.Entity.*;
import com.project.aura.SupplyChain.Repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Supply Chain Workflow Service
 *
 * Handles the full supply flow:
 *   Alert → SupplyRequest → Dispatch → Inventory Update
 *
 * All inventory-altering operations are @Transactional to prevent
 * partial updates or negative stock.
 */
@Service
@Transactional(readOnly = true)
public class SupplyChainService {

    private static final Logger log = LoggerFactory.getLogger(SupplyChainService.class);

    private final SupplyAlertRepository supplyAlertRepository;
    private final SupplyRequestRepository supplyRequestRepository;
    private final DispatchRepository dispatchRepository;
    private final HospitalInventoryRepository hospitalInventoryRepository;
    private final HospitalRepo hospitalRepo;
    private final InventoryItemRepository inventoryItemRepository;
    private final OutbreakReportRepository outbreakReportRepository;

    public SupplyChainService(
            SupplyAlertRepository supplyAlertRepository,
            SupplyRequestRepository supplyRequestRepository,
            DispatchRepository dispatchRepository,
            HospitalInventoryRepository hospitalInventoryRepository,
            HospitalRepo hospitalRepo,
            InventoryItemRepository inventoryItemRepository,
            OutbreakReportRepository outbreakReportRepository) {
        this.supplyAlertRepository = supplyAlertRepository;
        this.supplyRequestRepository = supplyRequestRepository;
        this.dispatchRepository = dispatchRepository;
        this.hospitalInventoryRepository = hospitalInventoryRepository;
        this.hospitalRepo = hospitalRepo;
        this.inventoryItemRepository = inventoryItemRepository;
        this.outbreakReportRepository = outbreakReportRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ALERT QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Returns all alerts for a given receiving hospital, enriched with
     * disease requirements and current inventory for each relevant item.
     */
    public List<SupplyAlertResponseDTO> getAlertsForHospital(Integer hospitalId) {
        return supplyAlertRepository
                .findByReceivingHospital_HospitalId(hospitalId)
                .stream()
                .map(this::toAlertResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns all alerts in the system (for system-wide admin views).
     */
    public List<SupplyAlertResponseDTO> getAllAlerts() {
        return supplyAlertRepository.findAll()
                .stream()
                .map(this::toAlertResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single alert by ID.
     */
    public SupplyAlertResponseDTO getAlertById(Integer alertId) {
        SupplyAlert alert = supplyAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + alertId));
        return toAlertResponseDTO(alert);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUPPLY REQUESTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Creates a supply request: a supply admin at Hospital B/C/D
     * responds to an alert and offers a quantity of an item.
     *
     * This does NOT deduct inventory yet — inventory is deducted when DISPATCHED.
     */
    @Transactional
    public SupplyRequestResponseDTO createSupplyRequest(SupplyRequestCreateDTO dto) {
        SupplyAlert alert = supplyAlertRepository.findById(dto.getAlertId())
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + dto.getAlertId()));

        if (alert.getStatus() == SupplyAlert.AlertStatus.REJECTED ||
                alert.getStatus() == SupplyAlert.AlertStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot create a request for a rejected or closed alert.");
        }

        if (dto.getQuantity() == null || dto.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be a positive integer.");
        }

        InventoryItem item = inventoryItemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem not found: " + dto.getItemId()));

        // Source = the hospital this alert was sent to (B, C, or D)
        Hospital sourceHospital = alert.getReceivingHospital();
        // Destination = the affected hospital (A)
        Hospital destinationHospital = alert.getOutbreakReport().getHospital();

        SupplyRequest request = SupplyRequest.builder()
                .supplyAlert(alert)
                .sourceHospital(sourceHospital)
                .destinationHospital(destinationHospital)
                .item(item)
                .requestedQuantity(dto.getQuantity())
                .status(SupplyRequest.RequestStatus.ACCEPTED)
                .build();

        request = supplyRequestRepository.save(request);

        // Update alert status to RESPONDED
        alert.setStatus(SupplyAlert.AlertStatus.RESPONDED);
        supplyAlertRepository.save(alert);

        log.info("[SUPPLY-CHAIN] SupplyRequest created: {} → {} | {} x {} (request id={})",
                sourceHospital.getName(), destinationHospital.getName(),
                dto.getQuantity(), item.getName(), request.getRequestId());

        return toRequestResponseDTO(request);
    }

    /**
     * Rejects a supply alert — the admin at Hospital B/C/D is declining to help.
     */
    @Transactional
    public SupplyAlertResponseDTO rejectAlert(Integer alertId) {
        SupplyAlert alert = supplyAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + alertId));
        alert.setStatus(SupplyAlert.AlertStatus.REJECTED);
        supplyAlertRepository.save(alert);
        return toAlertResponseDTO(alert);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPATCHES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Creates a Dispatch for an accepted SupplyRequest.
     * Deducts source hospital inventory immediately at dispatch creation
     * to prevent over-allocation.
     *
     * Throws if source hospital has insufficient stock.
     */
    @Transactional
    public DispatchResponseDTO createDispatch(Integer requestId) {
        SupplyRequest request = supplyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplyRequest not found: " + requestId));

        if (request.getStatus() != SupplyRequest.RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Cannot dispatch a request that is not in ACCEPTED status. Current: " + request.getStatus());
        }

        Hospital source = request.getSourceHospital();
        Hospital destination = request.getDestinationHospital();
        InventoryItem item = request.getItem();
        int qty = request.getRequestedQuantity();

        // ── Check source inventory ─────────────────────────────────────────────
        HospitalInventory sourceInventory = hospitalInventoryRepository
                .findByHospitalAndItem(source, item)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Hospital '" + source.getName() + "' has no inventory record for item '" + item.getName() + "'."));

        if (sourceInventory.getQuantity() < qty) {
            throw new IllegalArgumentException(
                    String.format("Insufficient stock at '%s': requested %d but only %d available for '%s'.",
                            source.getName(), qty, sourceInventory.getQuantity(), item.getName()));
        }

        // ── Deduct source inventory ────────────────────────────────────────────
        sourceInventory.setQuantity(sourceInventory.getQuantity() - qty);
        hospitalInventoryRepository.save(sourceInventory);

        log.info("[SUPPLY-CHAIN] Inventory deducted at '{}': {} → {} (item='{}')",
                source.getName(), sourceInventory.getQuantity() + qty, sourceInventory.getQuantity(), item.getName());

        // ── Create dispatch ────────────────────────────────────────────────────
        Dispatch dispatch = Dispatch.builder()
                .supplyRequest(request)
                .sourceHospital(source)
                .destinationHospital(destination)
                .item(item)
                .quantity(qty)
                .status(Dispatch.DispatchStatus.DISPATCHED)
                .dispatchedAt(LocalDateTime.now())
                .build();
        dispatch = dispatchRepository.save(dispatch);

        // Update request status to FULFILLED
        request.setStatus(SupplyRequest.RequestStatus.FULFILLED);
        supplyRequestRepository.save(request);

        log.info("[SUPPLY-CHAIN] Dispatch created: {} → {} | {} x {} (dispatch id={})",
                source.getName(), destination.getName(), qty, item.getName(), dispatch.getDispatchId());

        return toDispatchResponseDTO(dispatch);
    }

    /**
     * Updates the status of a dispatch (e.g. IN_TRANSIT → DELIVERED → RECEIVED).
     * When status becomes RECEIVED, destination hospital inventory is increased.
     */
    @Transactional
    public DispatchResponseDTO updateDispatchStatus(Integer dispatchId, String newStatusStr) {
        Dispatch dispatch = dispatchRepository.findById(dispatchId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispatch not found: " + dispatchId));

        Dispatch.DispatchStatus newStatus;
        try {
            newStatus = Dispatch.DispatchStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid dispatch status: " + newStatusStr +
                    ". Valid values: CREATED, DISPATCHED, IN_TRANSIT, DELIVERED, RECEIVED, CANCELLED");
        }

        Dispatch.DispatchStatus oldStatus = dispatch.getStatus();

        // ── Set timestamps based on status ─────────────────────────────────────
        switch (newStatus) {
            case DISPATCHED -> dispatch.setDispatchedAt(LocalDateTime.now());
            case DELIVERED -> dispatch.setDeliveredAt(LocalDateTime.now());
            case RECEIVED -> {
                dispatch.setReceivedAt(LocalDateTime.now());
                // ── Credit destination hospital inventory ──────────────────────
                creditDestinationInventory(dispatch);
            }
            default -> { /* No timestamp for IN_TRANSIT or CANCELLED */ }
        }

        dispatch.setStatus(newStatus);
        dispatch = dispatchRepository.save(dispatch);

        log.info("[SUPPLY-CHAIN] Dispatch {} status: {} → {}", dispatchId, oldStatus, newStatus);

        return toDispatchResponseDTO(dispatch);
    }

    /**
     * Retrieves all dispatches originating from a hospital.
     */
    public List<DispatchResponseDTO> getDispatchesBySourceHospital(Integer hospitalId) {
        return dispatchRepository.findBySourceHospital_HospitalId(hospitalId)
                .stream()
                .map(this::toDispatchResponseDTO)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INVENTORY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Returns all inventory for a hospital.
     */
    public HospitalInventoryResponseDTO getInventoryForHospital(Integer hospitalId) {
        Hospital hospital = hospitalRepo.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));

        List<HospitalInventory> inventoryList = hospitalInventoryRepository.findByHospital(hospital);

        List<InventoryStockDTO> stocks = inventoryList.stream()
                .map(inv -> InventoryStockDTO.builder()
                        .itemId(inv.getItem().getItemId())
                        .itemName(inv.getItem().getName())
                        .unit(inv.getItem().getUnit())
                        .availableQuantity(inv.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return HospitalInventoryResponseDTO.builder()
                .hospitalId(hospitalId)
                .hospitalName(hospital.getName())
                .inventory(stocks)
                .retrievedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Sets (creates or updates) the stock quantity for a hospital + item pair.
     * Used by administrators to seed or correct inventory data.
     *
     * Enforces: quantity >= 0.
     */
    @Transactional
    public InventoryStockDTO upsertInventory(InventoryUpdateDTO dto) {
        if (dto.getQuantity() == null || dto.getQuantity() < 0) {
            throw new IllegalArgumentException("Inventory quantity must be >= 0.");
        }

        Hospital hospital = hospitalRepo.findById(dto.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + dto.getHospitalId()));

        InventoryItem item = inventoryItemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem not found: " + dto.getItemId()));

        HospitalInventory inventory = hospitalInventoryRepository
                .findByHospitalAndItem(hospital, item)
                .orElseGet(() -> HospitalInventory.builder()
                        .hospital(hospital)
                        .item(item)
                        .quantity(0)
                        .build());

        inventory.setQuantity(dto.getQuantity());
        inventory = hospitalInventoryRepository.save(inventory);

        return InventoryStockDTO.builder()
                .itemId(item.getItemId())
                .itemName(item.getName())
                .unit(item.getUnit())
                .availableQuantity(inventory.getQuantity())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUPPLY REQUESTS QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    public List<SupplyRequestResponseDTO> getRequestsBySourceHospital(Integer hospitalId) {
        return supplyRequestRepository.findBySourceHospital_HospitalId(hospitalId)
                .stream()
                .map(this::toRequestResponseDTO)
                .collect(Collectors.toList());
    }

    public List<SupplyRequestResponseDTO> getRequestsByDestinationHospital(Integer hospitalId) {
        return supplyRequestRepository.findByDestinationHospital_HospitalId(hospitalId)
                .stream()
                .map(this::toRequestResponseDTO)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OUTBREAK REPORT QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    public List<OutbreakReport> getAllOutbreakReports() {
        return outbreakReportRepository.findAll();
    }

    public List<OutbreakReport> getActiveOutbreaks() {
        return outbreakReportRepository.findByOutbreakDetectedTrue();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Credits the destination hospital's inventory when a dispatch is RECEIVED.
     * Called inside an existing @Transactional context.
     */
    private void creditDestinationInventory(Dispatch dispatch) {
        Hospital destination = dispatch.getDestinationHospital();
        InventoryItem item = dispatch.getItem();
        int qty = dispatch.getQuantity();

        HospitalInventory destInventory = hospitalInventoryRepository
                .findByHospitalAndItem(destination, item)
                .orElseGet(() -> {
                    log.info("[SUPPLY-CHAIN] Creating new inventory record for '{}' at '{}'",
                            item.getName(), destination.getName());
                    return HospitalInventory.builder()
                            .hospital(destination)
                            .item(item)
                            .quantity(0)
                            .build();
                });

        int previousQty = destInventory.getQuantity();
        destInventory.setQuantity(previousQty + qty);
        hospitalInventoryRepository.save(destInventory);

        log.info("[SUPPLY-CHAIN] Inventory credited at '{}': {} → {} (item='{}')",
                destination.getName(), previousQty, destInventory.getQuantity(), item.getName());
    }

    // ── DTO Mappers ──────────────────────────────────────────────────────────

    private SupplyAlertResponseDTO toAlertResponseDTO(SupplyAlert alert) {
        OutbreakReport report = alert.getOutbreakReport();
        Disease disease = report.getDisease();
        Hospital affectedHospital = report.getHospital();
        Hospital receivingHospital = alert.getReceivingHospital();

        // Requirements for this disease
        List<RequirementDTO> requirements = disease.getRequirements().stream()
                .map(req -> RequirementDTO.builder()
                        .itemId(req.getItem().getItemId())
                        .itemName(req.getItem().getName())
                        .unit(req.getItem().getUnit())
                        .suggestedQuantity(req.getSuggestedQuantity())
                        .build())
                .collect(Collectors.toList());

        // Current inventory at the receiving hospital for relevant items
        List<InventoryStockDTO> currentInventory = requirements.stream()
                .map(req -> {
                    int available = hospitalInventoryRepository
                            .findByHospital_HospitalIdAndItem_ItemId(
                                    receivingHospital.getHospitalId(), req.getItemId())
                            .map(HospitalInventory::getQuantity)
                            .orElse(0);
                    return InventoryStockDTO.builder()
                            .itemId(req.getItemId())
                            .itemName(req.getItemName())
                            .unit(req.getUnit())
                            .availableQuantity(available)
                            .build();
                })
                .collect(Collectors.toList());

        return SupplyAlertResponseDTO.builder()
                .alertId(alert.getAlertId())
                .status(alert.getStatus())
                .createdAt(alert.getCreatedAt())
                .reportId(report.getReportId())
                .affectedHospitalName(affectedHospital.getName())
                .affectedHospitalId(affectedHospital.getHospitalId())
                .diseaseName(disease.getName())
                .diseaseId(disease.getDiseaseId())
                .reportedCases(report.getReportedCases())
                .receivingHospitalName(receivingHospital.getName())
                .receivingHospitalId(receivingHospital.getHospitalId())
                .requirements(requirements)
                .currentInventory(currentInventory)
                .build();
    }

    private SupplyRequestResponseDTO toRequestResponseDTO(SupplyRequest request) {
        return SupplyRequestResponseDTO.builder()
                .requestId(request.getRequestId())
                .alertId(request.getSupplyAlert().getAlertId())
                .sourceHospitalName(request.getSourceHospital().getName())
                .sourceHospitalId(request.getSourceHospital().getHospitalId())
                .destinationHospitalName(request.getDestinationHospital().getName())
                .destinationHospitalId(request.getDestinationHospital().getHospitalId())
                .itemName(request.getItem().getName())
                .itemId(request.getItem().getItemId())
                .requestedQuantity(request.getRequestedQuantity())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .build();
    }

    private DispatchResponseDTO toDispatchResponseDTO(Dispatch dispatch) {
        return DispatchResponseDTO.builder()
                .dispatchId(dispatch.getDispatchId())
                .requestId(dispatch.getSupplyRequest().getRequestId())
                .sourceHospitalName(dispatch.getSourceHospital().getName())
                .sourceHospitalId(dispatch.getSourceHospital().getHospitalId())
                .destinationHospitalName(dispatch.getDestinationHospital().getName())
                .destinationHospitalId(dispatch.getDestinationHospital().getHospitalId())
                .itemName(dispatch.getItem().getName())
                .itemId(dispatch.getItem().getItemId())
                .quantity(dispatch.getQuantity())
                .status(dispatch.getStatus())
                .createdAt(dispatch.getCreatedAt())
                .dispatchedAt(dispatch.getDispatchedAt())
                .deliveredAt(dispatch.getDeliveredAt())
                .receivedAt(dispatch.getReceivedAt())
                .build();
    }
}
