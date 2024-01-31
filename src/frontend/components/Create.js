import { useState } from 'react';
import { ethers } from 'ethers';
import { Row, Form, Button } from 'react-bootstrap';
import { S3 } from 'aws-sdk'; // Import the AWS SDK S3 module

const s3 = new S3({
  accessKeyId: 'AKIARVRI4UFQA4L36HGX', // Replace with your AWS access key ID
  secretAccessKey: 'YXhjEQ1gr65DJZ6/HuQnUEvIcI0kTt9nGue5UTSi', // Replace with your AWS secret access key
  region: 'ap-south-1', // Replace with your AWS region
});

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('');
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const uploadToS3 = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== 'undefined') {
      try {
        const params = {
          Bucket: 'nfthappy', // Replace with your S3 bucket name
          Key: `images/${file.name}`, // Specify the key (path) where you want to store the file in the S3 bucket
          Body: file,
        };

        const result = await s3.upload(params).promise();
        console.log(result);
        setImage(result.Location); // Use the URL provided by S3 as the image URL
      } catch (error) {
        console.log('S3 image upload error: ', error);
      }
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;
    try {
      const result = await s3.upload({
        Bucket: 'nfthappy', // Replace with your S3 bucket name
        Key: `metadata/${Date.now()}.json`, // Specify the key (path) for the metadata file
        Body: JSON.stringify({ image, price, name, description }),
      }).promise();

      mintThenList(result);
    } catch (error) {
      console.log('S3 metadata upload error: ', error);
    }
  };

  const mintThenList = async (result) => {
    const uri = result.Location;
    // mint nft
    await (await nft.mint(uri)).wait();
    // get tokenId of new nft
    const id = await nft.tokenCount();
    // approve marketplace to spend nft
    await (await nft.setApprovalForAll(marketplace.address, true)).wait();
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString());
    await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToS3}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Create;
