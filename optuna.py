import optuna
import torch
import yaml
from pathlib import Path
from torch.utils.data import DataLoader
from torch.optim import Adam
# from yolov5.datasets import YoloDataset
from yolov5.models.yolo import Model
from yolov5.utils.loss import computeLoss


def create_model(trial):
    # Define hyperparameters to optimize
    n_blocks = trial.suggest_int('n_blocks', 1, 4)
    channels = trial.suggest_categorical('channels', [32, 64, 128, 256, 512])
    dropout = trial.suggest_uniform('dropout', 0.0, 0.5)

    # Create model config dictionary
    model_dict = dict(
        backbone=dict(
            n_blocks=n_blocks,
            channels=channels,
            dropout=dropout,
        ),
        neck=dict(
            channels=channels,
        ),
        head=dict(
            channels=channels,
        ),
    )

    # Write model config to YAML file
    model_config_path = 'C:/Users/ACER/yolov5/data_images/data.yaml'
    with open(model_config_path, 'w') as f:
        yaml.dump(model_dict, f)

    # Create YOLOv5 model
    model = Model(model_config_path)

    return model


def objective(trial):
    # Create YOLOv5 model
    model = create_model(trial)

    # Define data directories and parameters
    train_dir = Path('C:/Users/ACER/yolov5/data_images/train')
    test_dir = Path('C:/Users/ACER/yolov5/data_images/test')
    batch_size = trial.suggest_categorical('batch_size', [8, 16, 32, 64])
    lr = trial.suggest_loguniform('lr', 1e-5, 1e-2)

    # Create data loaders
    train_dataset = YoloDataset(train_dir)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_dataset = YoloDataset(test_dir)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    # Define optimizer
    optimizer = Adam(model.parameters(), lr=lr)

    # Train model
    n_epochs = 10
    for epoch in range(n_epochs):
        for i, (images, targets) in enumerate(train_loader):
            # Move data to GPU if available
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            images, targets = images.to(device), targets.to(device)

            # Forward pass
            loss, _, _, _ = compute_loss(model(images), targets)

            # Backward pass and optimization
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # Evaluate model on test set after each epoch
        total_loss = 0
        with torch.no_grad():
            for images, targets in test_loader:
                # Move data to GPU if available
                device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
                images, targets = images.to(device), targets.to(device)

                # Compute loss
                loss, _, _, _ = compute_loss(model(images), targets)
                total_loss += loss.item()

        # Report test loss
        test_loss = total_loss / len(test_loader)
        trial.report(test_loss, epoch)

        # Early stopping
        if trial.should_prune():
            raise optuna.exceptions.TrialPruned()

    return test_loss